import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ReminderService } from "./reminder.service";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { TypedRequestBody } from "../../types/request.type";
import { createReminderType, updateReminderType } from "./reminder.type";

export class ReminderController {
  constructor(private reminderService: ReminderService) {}

  createReminder = asyncHandler(
    async (
      req: TypedRequestBody<createReminderType>,
      res: Response,
      _next: NextFunction
    ) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const reminder = await this.reminderService.createReminder(req.body, userId);

      res.status(HttpCodes.Created).json({
        success: true,
        message: "Reminder created successfully",
        data: reminder,
      });
    }
  );

  getMyReminders = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const reminders = await this.reminderService.getUserReminders(userId);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Reminders fetched successfully",
        data: reminders,
      });
    }
  );

  updateReminder = asyncHandler(
    async (
      req: Request<{ id: string }, {}, updateReminderType>,
      res: Response,
      _next: NextFunction
    ) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const reminder = await this.reminderService.updateReminder(
        req.params.id,
        req.body,
        userId
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Reminder updated successfully",
        data: reminder,
      });
    }
  );

  deleteReminder = asyncHandler(
    async (req: Request<{ id: string }>, res: Response, _next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const reminder = await this.reminderService.deleteReminder(
        req.params.id,
        userId
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Reminder deleted successfully",
        data: reminder,
      });
    }
  );
}
