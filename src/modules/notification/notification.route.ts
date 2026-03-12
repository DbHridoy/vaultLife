import { Router } from "express";
import { authMiddleware, notificationController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import { CreateNotificationSchema } from "./notification.schema";

const notificationRoute = Router();

notificationRoute.use(authMiddleware.authenticate);
notificationRoute.post("/me", validate(CreateNotificationSchema), notificationController.createMyNotification);
notificationRoute.get("/me", notificationController.getMyNotifications);
notificationRoute.post(
  "/process-due-reminders",
  authMiddleware.authorize(["superadmin", "admin"]),
  notificationController.processDueReminders
);

export default notificationRoute;
