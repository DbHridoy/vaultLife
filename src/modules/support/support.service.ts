import { SupportRepository } from "./support.repository";
import { createSupportType, resolveSupportReportType } from "./support.type";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { NotificationService } from "../notification/notification.service";
import { Mailer } from "../../utils/mailer-utils";
import { MulterFile } from "../../types/request.type";
import { env } from "../../config/env";
import fileUploadUtils from "../../utils/s3-upload";
import path from "path";

export class SupportService {
  constructor(
    private supportRepository: SupportRepository,
    private notificationService: NotificationService,
    private mailer: Mailer
  ) {}

  private ensureStorageConfig() {
    if (
      !env.S3_BUCKET_NAME ||
      !env.S3_BUCKET_REGION ||
      !env.AWS_ACCESS_KEY ||
      !env.AWS_SECRET_KEY
    ) {
      throw new Error("S3 configuration is incomplete");
    }
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  }

  private async uploadResolutionAttachments(attachments: MulterFile[]) {
    if (attachments.length === 0) {
      return [];
    }

    this.ensureStorageConfig();

    return await Promise.all(
      attachments.map(async (attachment) => {
        const extension = path.extname(attachment.originalname);
        const safeFileName = this.sanitizeFileName(
          path.basename(attachment.originalname, extension)
        );
        const s3Key = `support-resolutions/${Date.now()}-${safeFileName}${extension}`;
        const fileUrl = await fileUploadUtils.uploadToS3(
          attachment.buffer,
          s3Key,
          attachment.mimetype
        );

        return {
          fileName: attachment.originalname,
          fileUrl,
          mimeType: attachment.mimetype,
          size: attachment.size,
          s3Key,
        };
      })
    );
  }

  createReport = async (userId: string, payload: createSupportType) => {
    const report = await this.supportRepository.createReport({
      userId,
      ...payload,
      status: "open",
    });

    await this.notificationService.notifyAdmins(
      {
        title: "New support report submitted",
        message: `A new support report was submitted: ${report.title}.`,
      },
      {
        event: "support_report_created",
        reportId: report._id.toString(),
        reportedByUserId: userId,
        reportTitle: report.title,
        reportStatus: report.status,
      }
    );

    return report;
  };

  getMyReports = async (userId: string) => {
    return await this.supportRepository.getReportsByUserId(userId);
  };

  getAllReports = async () => {
    return await this.supportRepository.getAllReports();
  };

  getReportById = async (id: string) => {
    const report = await this.supportRepository.getReportById(id);

    if (!report) {
      throw new apiError(Errors.NotFound.code, "Support report not found");
    }

    return report;
  };

  updateReportStatus = async (id: string, status: string) => {
    const report = await this.supportRepository.updateReportStatus(id, status);

    if (!report) {
      throw new apiError(Errors.NotFound.code, "Support report not found");
    }

    return report;
  };

  resolveReport = async (
    id: string,
    adminUserId: string,
    payload: resolveSupportReportType,
    attachments: MulterFile[] = []
  ) => {
    const report = await this.supportRepository.getReportById(id);

    if (!report) {
      throw new apiError(Errors.NotFound.code, "Support report not found");
    }

    const reportUser = report.userId as {
      _id: { toString(): string };
      email?: string;
      fullName?: string;
    } | null;

    if (!reportUser?.email) {
      throw new apiError(
        Errors.NotFound.code,
        "Support report user email not found"
      );
    }

    if (report.status === "resolved" || report.closedAt) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "Support report is already resolved and closed"
      );
    }

    const resolutionAttachments =
      await this.uploadResolutionAttachments(attachments);

    await this.mailer.sendSupportResolution(
      reportUser.email,
      report.title,
      payload.resolutionNote,
      attachments.map((attachment) => ({
        filename: attachment.originalname,
        content: attachment.buffer,
        contentType: attachment.mimetype,
        path: resolutionAttachments.find(
          (uploadedAttachment) =>
            uploadedAttachment.fileName === attachment.originalname &&
            uploadedAttachment.size === attachment.size
        )?.fileUrl,
      }))
    );

    const resolvedAt = new Date();
    const resolvedReport = await this.supportRepository.resolveReport(id, {
      status: "resolved",
      resolutionNote: payload.resolutionNote,
      resolvedBy: adminUserId,
      resolvedAt,
      closedAt: resolvedAt,
      isClosed: true,
      resolutionAttachments,
    });

    if (!resolvedReport) {
      throw new apiError(Errors.NotFound.code, "Support report not found");
    }

    await this.notificationService.sendNotificationToUser(
      reportUser._id.toString(),
      {
        title: "Your support report has been resolved",
        message: `Your report "${report.title}" has been resolved and closed.`,
      },
      {
        event: "support_report_resolved",
        reportId: resolvedReport._id.toString(),
        resolutionNote: payload.resolutionNote,
        resolutionAttachmentUrls: resolutionAttachments.map(
          (attachment) => attachment.fileUrl
        ),
        closedAt: resolvedAt.toISOString(),
      }
    );

    return resolvedReport;
  };
}
