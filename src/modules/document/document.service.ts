import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { DocumentRepository } from "./document.repository";
import fileUploadUtils from "../../utils/s3-upload";
import { FileAnalyzerAI } from "../../utils/file-analyzer-ai";
import { env } from "../../config/env";
import { MulterFile } from "../../types/request.type";
import {
  confirmDocumentType,
  DocumentListQuery,
  updateDocumentType,
} from "./document.type";
import { Roles } from "../../constants/roles";

type DocumentDraft = {
  id: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private fileAnalyzerAI: FileAnalyzerAI
  ) {}

  private readonly draftDirectory = path.join("/tmp", "dlindsey03-document-drafts");
  private readonly draftTtlMs = 1000 * 60 * 60;

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

  private buildDraftTitle(originalName: string, aiTitle?: string) {
    const normalizedAiTitle = aiTitle?.trim();
    if (normalizedAiTitle) {
      return normalizedAiTitle;
    }

    const fileNameWithoutExtension = path.parse(originalName).name.trim();
    return fileNameWithoutExtension || "Untitled Document";
  }

  private async ensureDraftDirectory() {
    await fs.mkdir(this.draftDirectory, { recursive: true });
  }

  private getDraftMetadataPath(draftId: string) {
    return path.join(this.draftDirectory, `${draftId}.json`);
  }

  private formatDocumentResponse(document: any) {
    const rawDocument =
      typeof document?.toObject === "function" ? document.toObject() : document;

    if (!rawDocument || typeof rawDocument !== "object") {
      return rawDocument;
    }

    const { documentType, documentCategory, ...rest } = rawDocument;

    return {
      ...rest,
      documentCategory: documentCategory || documentType || "Other",
    };
  }

  private sanitizeDocumentListQuery(query: DocumentListQuery = {}) {
    const sanitizedEntries = Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    );

    return Object.fromEntries(sanitizedEntries) as DocumentListQuery;
  }

  private canManageDocument(
    user: { userId: string; role: string },
    document: { uploadedBy?: { toString(): string } | string | null }
  ) {
    if (user.role === Roles.Admin || user.role === Roles.SuperAdmin) {
      return true;
    }

    const uploadedBy =
      typeof document.uploadedBy === "string"
        ? document.uploadedBy
        : document.uploadedBy?.toString();

    return uploadedBy === user.userId;
  }

  private async cleanupExpiredDrafts() {
    await this.ensureDraftDirectory();
    const entries = await fs.readdir(this.draftDirectory);
    const now = Date.now();

    await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".json"))
        .map(async (entry) => {
          const metadataPath = path.join(this.draftDirectory, entry);

          try {
            const rawDraft = await fs.readFile(metadataPath, "utf-8");
            const draft = JSON.parse(rawDraft) as DocumentDraft;

            if (now - new Date(draft.createdAt).getTime() <= this.draftTtlMs) {
              return;
            }

            await fs.unlink(metadataPath).catch(() => undefined);
            await fs.unlink(draft.filePath).catch(() => undefined);
          } catch {
            await fs.unlink(metadataPath).catch(() => undefined);
          }
        })
    );
  }

  private async storeDraft(file: MulterFile, userId: string) {
    await this.cleanupExpiredDrafts();
    await this.ensureDraftDirectory();

    const draftId = randomUUID();
    const extension = path.extname(file.originalname) || ".bin";
    const filePath = path.join(this.draftDirectory, `${draftId}${extension}`);
    const metadataPath = this.getDraftMetadataPath(draftId);
    const draft: DocumentDraft = {
      id: draftId,
      filePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, file.buffer);
    await fs.writeFile(metadataPath, JSON.stringify(draft), "utf-8");

    return draft;
  }

  private async getDraft(draftId: string, userId: string) {
    await this.cleanupExpiredDrafts();

    const metadataPath = this.getDraftMetadataPath(draftId);

    let draft: DocumentDraft;
    try {
      const rawDraft = await fs.readFile(metadataPath, "utf-8");
      draft = JSON.parse(rawDraft) as DocumentDraft;
    } catch {
      throw new apiError(Errors.NotFound.code, "Document draft not found");
    }

    if (draft.uploadedBy !== userId) {
      throw new apiError(Errors.Forbidden.code, "You cannot access this document draft");
    }

    if (Date.now() - new Date(draft.createdAt).getTime() > this.draftTtlMs) {
      await fs.unlink(metadataPath).catch(() => undefined);
      await fs.unlink(draft.filePath).catch(() => undefined);
      throw new apiError(Errors.NotFound.code, "Document draft has expired");
    }

    return draft;
  }

  private async deleteDraft(draft: DocumentDraft) {
    await fs.unlink(this.getDraftMetadataPath(draft.id)).catch(() => undefined);
    await fs.unlink(draft.filePath).catch(() => undefined);
  }

  async uploadDocument(file: MulterFile | undefined, userId: string) {
    if (!file) {
      throw new apiError(HttpStatus.BAD_REQUEST, "Document file is required");
    }

    const draft = await this.storeDraft(file, userId);
    let aiResult;

    try {
      aiResult = await this.fileAnalyzerAI.analyzeDocument(draft.filePath);
    } catch (error) {
      await this.deleteDraft(draft);
      throw error;
    }

    return {
      draftId: draft.id,
      title: this.buildDraftTitle(draft.originalName, aiResult.title),
      originalName: draft.originalName,
      mimeType: draft.mimeType,
      size: draft.size,
      documentCategory: aiResult.documentCategory,
      extractedData: aiResult.fields,
      expiresAt: new Date(Date.now() + this.draftTtlMs).toISOString(),
    };
  }

  async confirmDocument(payload: confirmDocumentType, userId: string) {
    this.ensureStorageConfig();

    const draft = await this.getDraft(payload.draftId, userId);
    const fileBuffer = await fs.readFile(draft.filePath);
    const extension = path.extname(draft.originalName);
    const safeFileName = this.sanitizeFileName(
      path.basename(draft.originalName, extension)
    );
    const s3Key = `documents/${Date.now()}-${safeFileName}${extension}`;

    try {
      const fileUrl = await fileUploadUtils.uploadToS3(
        fileBuffer,
        s3Key,
        draft.mimeType
      );

      const document = await this.documentRepository.createDocument({
        originalName: draft.originalName,
        title: payload.title,
        mimeType: draft.mimeType,
        size: draft.size,
        s3Key,
        fileUrl,
        documentCategory: payload.documentCategory,
        extractedData: payload.extractedData,
        uploadedBy: userId,
      });

      await this.deleteDraft(draft);
      return this.formatDocumentResponse(document);
    } catch (error) {
      throw error;
    }
  }

  async getAllDocuments(
    query: DocumentListQuery,
    user: { userId: string; role: string }
  ) {
    const sanitizedQuery = this.sanitizeDocumentListQuery(query);
    const baseFilter =
      user.role === Roles.Admin || user.role === Roles.SuperAdmin
        ? {}
        : { uploadedBy: user.userId };

    const { data, total } = await this.documentRepository.getAllDocuments(
      sanitizedQuery,
      baseFilter
    );

    const page = Math.max(Number(sanitizedQuery.page) || 1, 1);
    const limit = Math.max(Number(sanitizedQuery.limit) || 0, 0);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : total > 0 ? 1 : 0;

    return {
      data: data.map((document) => this.formatDocumentResponse(document)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: limit > 0 ? page < totalPages : false,
      hasPrevPage: limit > 0 ? page > 1 : false,
    };
  }

  async getDocumentById(id: string) {
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new apiError(Errors.NotFound.code, "Document not found");
    }

    return this.formatDocumentResponse(document);
  }

  async updateDocument(
    id: string,
    payload: updateDocumentType,
    user: { userId: string; role: string }
  ) {
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new apiError(Errors.NotFound.code, "Document not found");
    }

    if (!this.canManageDocument(user, document)) {
      throw new apiError(
        Errors.Forbidden.code,
        "You are not allowed to edit this document"
      );
    }

    const updatedDocument = await this.documentRepository.updateDocument(id, payload);

    if (!updatedDocument) {
      throw new apiError(Errors.NotFound.code, "Document not found");
    }

    return this.formatDocumentResponse(updatedDocument);
  }

  async deleteDocument(id: string, user: { userId: string; role: string }) {
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new apiError(Errors.NotFound.code, "Document not found");
    }

    if (!this.canManageDocument(user, document)) {
      throw new apiError(
        Errors.Forbidden.code,
        "You are not allowed to delete this document"
      );
    }

    await this.documentRepository.deleteDocument(id);
  }
}

const HttpStatus = {
  BAD_REQUEST: 400,
};
