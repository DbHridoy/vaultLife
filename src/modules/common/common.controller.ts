import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";
import { CommonService } from "./common.service";
import { TypedRequestBody } from "../../types/request.type";
import { createCommonType, updateCommonType } from "./common.type";

export class CommonController {
  constructor(private commonService: CommonService) {}

  getContent = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const content = await this.commonService.getContent();

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Common content fetched successfully",
        data: content,
      });
    }
  );

  createContent = asyncHandler(
    async (
      req: TypedRequestBody<createCommonType>,
      res: Response,
      _next: NextFunction
    ) => {
      const content = await this.commonService.createContent(req.body);

      res.status(HttpCodes.Created).json({
        success: true,
        message: "Common content created successfully",
        data: content,
      });
    }
  );

  updateContent = asyncHandler(
    async (
      req: TypedRequestBody<updateCommonType>,
      res: Response,
      _next: NextFunction
    ) => {
      const content = await this.commonService.updateContent(req.body);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Common content updated successfully",
        data: content,
      });
    }
  );
}
