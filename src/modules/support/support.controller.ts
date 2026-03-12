import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { SupportService } from "./support.service";
import { TypedRequestBody } from "../../types/request.type";
import { createSupportType, updateSupportStatusType } from "./support.type";
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
      req: Request<{ id: string }, {}, updateSupportStatusType>,
      res: Response,
      _next: NextFunction
    ) => {
      const report = await this.supportService.updateReportStatus(
        req.params.id,
        req.body.status
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Support report status updated successfully",
        data: report,
      });
    }
  );
}
