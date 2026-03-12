import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { NotificationService } from "./notification.service";
import { TypedRequestBody } from "../../types/request.type";
import { createNotificationType } from "./notification.type";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { HttpCodes } from "../../constants/status-codes";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  createMyNotification = asyncHandler(
    async (
      req: TypedRequestBody<createNotificationType>,
      res: Response,
      _next: NextFunction
    ) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const notification = await this.notificationService.sendNotificationToUser(
        userId,
        req.body
      );

      res.status(HttpCodes.Created).json({
        success: true,
        message: "Notification created and sent successfully",
        data: notification,
      });
    }
  );

  getMyNotifications = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const notifications = await this.notificationService.getMyNotifications(userId);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Notifications fetched successfully",
        data: notifications,
      });
    }
  );

  processDueReminders = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const notifications = await this.notificationService.processDueReminders();

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Due reminders processed successfully",
        data: notifications,
      });
    }
  );
}
