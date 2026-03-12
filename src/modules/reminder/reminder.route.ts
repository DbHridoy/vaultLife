import { Router } from "express";
import { authMiddleware, reminderController } from "../../container";
import { validate } from "../../middlewares/validate.middleware";
import { CreateReminderSchema, UpdateReminderSchema } from "./reminder.schema";

const reminderRoute = Router();

reminderRoute.use(authMiddleware.authenticate);
reminderRoute.post("/", validate(CreateReminderSchema), reminderController.createReminder);
reminderRoute.get("/me", reminderController.getMyReminders);
reminderRoute.patch("/:id", validate(UpdateReminderSchema), reminderController.updateReminder);
reminderRoute.delete("/:id", reminderController.deleteReminder);

export default reminderRoute;
