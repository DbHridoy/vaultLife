import z from "zod";
import { CreateNotificationSchema } from "./notification.schema";

export type createNotificationType = z.infer<typeof CreateNotificationSchema>;
