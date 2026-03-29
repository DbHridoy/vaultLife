import z from "zod";
import {
  CreateNotificationSchema,
  UpdateNotificationReadStatusSchema,
} from "./notification.schema";

export type createNotificationType = z.infer<typeof CreateNotificationSchema>;
export type updateNotificationReadStatusType = z.infer<
  typeof UpdateNotificationReadStatusSchema
>;
