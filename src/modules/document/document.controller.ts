import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { DocumentService } from "./document.service";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { TypedRequestBodyWithFile } from "../../types/request.type";

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

      res.status(HttpCodes.Created).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    }
  );

  getAllDocuments = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const documents = await this.documentService.getAllDocuments();

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Documents fetched successfully",
        data: documents,
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
}
