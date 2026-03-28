import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { SupportService } from "./support.service";
import { TypedRequestBody, TypedRequestBodyWithFile } from "../../types/request.type";
import {
  createSupportType,
  resolveSupportReportType,
  updateSupportStatusType,
} from "./support.type";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { HttpCodes } from "../../constants/status-codes";

export class SupportController {
  constructor(private supportService: SupportService) {}

  createReport = asyncHandler(
    async (
      req: TypedRequestBody<createSupportType>,
      res: Response,
      _next: NextFunction
    ) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const report = await this.supportService.createReport(userId, req.body);

      res.status(HttpCodes.Created).json({
        success: true,
        message: "Support report created successfully",
        data: report,
      });
    }
  );

  getMyReports = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const reports = await this.supportService.getMyReports(userId);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Support reports fetched successfully",
        data: reports,
      });
    }
  );

  getAllReports = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const reports = await this.supportService.getAllReports();

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "All support reports fetched successfully",
        data: reports,
      });
    }
  );

  getReportById = asyncHandler(
    async (req: Request<{ id: string }>, res: Response, _next: NextFunction) => {
      const report = await this.supportService.getReportById(req.params.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Support report fetched successfully",
        data: report,
      });
    }
  );

  updateReportStatus = asyncHandler(
    async (
      req: TypedRequestBodyWithFile<updateSupportStatusType> & Request<{ id: string }>,
      res: Response,
      _next: NextFunction
    ) => {
      const adminUserId = req.user?.userId;

      if (!adminUserId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const report =
        req.body.status === "resolved"
          ? await this.supportService.resolveReport(
              req.params.id,
              adminUserId,
              {
                resolutionNote: req.body.resolutionNote!.trim(),
              },
              Array.isArray(req.files) ? req.files : req.file ? [req.file] : []
            )
          : await this.supportService.updateReportStatus(
              req.params.id,
              req.body.status
            );

      res.status(HttpCodes.Ok).json({
        success: true,
        message:
          req.body.status === "resolved"
            ? "Support report resolved and closed successfully"
            : "Support report status updated successfully",
        data: report,
      });
    }
  );

  resolveReport = asyncHandler(
    async (
      req: TypedRequestBodyWithFile<resolveSupportReportType> & Request<{ id: string }>,
      res: Response,
      _next: NextFunction
    ) => {
      const adminUserId = req.user?.userId;

      if (!adminUserId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const report = await this.supportService.resolveReport(
        req.params.id,
        adminUserId,
        req.body,
        Array.isArray(req.files) ? req.files : req.file ? [req.file] : []
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Support report resolved and closed successfully",
        data: report,
      });
    }
  );
}
