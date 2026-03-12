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

export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private fileAnalyzerAI: FileAnalyzerAI
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

  async uploadDocument(file: MulterFile | undefined, userId: string) {
    if (!file) {
      throw new apiError(HttpStatus.BAD_REQUEST, "Document file is required");
    }

    this.ensureStorageConfig();

    const extension = path.extname(file.originalname);
    const safeFileName = this.sanitizeFileName(
      path.basename(file.originalname, extension)
    );
    const tempFilePath = path.join(
      "/tmp",
      `${Date.now()}-${randomUUID()}${extension || ".bin"}`
    );

    await fs.writeFile(tempFilePath, file.buffer);

    try {
      const aiResult = await this.fileAnalyzerAI.analyzeDocument(tempFilePath);
      const s3Key = `documents/${Date.now()}-${safeFileName}${extension}`;
      const fileUrl = await fileUploadUtils.uploadToS3(
        file.buffer,
        s3Key,
        file.mimetype
      );

      return await this.documentRepository.createDocument({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        s3Key,
        fileUrl,
        documentType: aiResult.documentType,
        extractedData: aiResult.fields,
        uploadedBy: userId,
      });
    } finally {
      await fs.unlink(tempFilePath).catch(() => undefined);
    }
  }

  async getAllDocuments() {
    return await this.documentRepository.getAllDocuments();
  }

  async getDocumentById(id: string) {
    const document = await this.documentRepository.getDocumentById(id);

    if (!document) {
      throw new apiError(Errors.NotFound.code, "Document not found");
    }

    return document;
  }
}

const HttpStatus = {
  BAD_REQUEST: 400,
};
