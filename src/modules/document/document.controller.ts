import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { DocumentService } from "./document.service";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { TypedRequestBodyWithFile } from "../../types/request.type";
import { TypedRequestBody, TypedRequestParams } from "../../types/request.type";
import {
  confirmDocumentType,
  DocumentListQuery,
  updateDocumentType,
} from "./document.type";

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  uploadDocument = asyncHandler(
    async (
      req: TypedRequestBodyWithFile<Record<string, never>>,
      res: Response,
      _next: NextFunction
    ) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, "Unauthorized");
      }

      const document = await this.documentService.uploadDocument(req.file, userId);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Document analyzed successfully",
        data: document,
      });
    }
  );

  confirmDocument = asyncHandler(
    async (
      req: TypedRequestBody<confirmDocumentType>,
      res: Response,
      _next: NextFunction
    ) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, "Unauthorized");
      }

      const document = await this.documentService.confirmDocument(req.body, userId);

      res.status(HttpCodes.Created).json({
        success: true,
        message: "Document saved successfully",
        data: document,
      });
    }
  );

  getAllDocuments = asyncHandler(
    async (req: Request<{}, {}, {}, DocumentListQuery>, res: Response, _next: NextFunction) => {
      if (!req.user?.userId || !req.user.role) {
        throw new apiError(Errors.Unauthorized.code, "Unauthorized");
      }

      const documents = await this.documentService.getAllDocuments(req.query, req.user);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Documents fetched successfully",
        data: documents.data,
        total: documents.total,
        page: documents.page,
        limit: documents.limit,
        totalPages: documents.totalPages,
        hasNextPage: documents.hasNextPage,
        hasPrevPage: documents.hasPrevPage,
      });
    }
  );

  getDocumentById = asyncHandler(
    async (
      req: Request<{ id: string }>,
      res: Response,
      _next: NextFunction
    ) => {
      const document = await this.documentService.getDocumentById(req.params.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Document fetched successfully",
        data: document,
      });
    }
  );

  updateDocument = asyncHandler(
    async (
      req: TypedRequestParams<{ id: string }, updateDocumentType>,
      res: Response,
      _next: NextFunction
    ) => {
      if (!req.user?.userId || !req.user.role) {
        throw new apiError(Errors.Unauthorized.code, "Unauthorized");
      }

      const document = await this.documentService.updateDocument(
        req.params.id,
        req.body,
        req.user
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Document updated successfully",
        data: document,
      });
    }
  );

  deleteDocument = asyncHandler(
    async (
      req: Request<{ id: string }>,
      res: Response,
      _next: NextFunction
    ) => {
      if (!req.user?.userId || !req.user.role) {
        throw new apiError(Errors.Unauthorized.code, "Unauthorized");
      }

      await this.documentService.deleteDocument(req.params.id, req.user);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Document deleted successfully",
      });
    }
  );
}
