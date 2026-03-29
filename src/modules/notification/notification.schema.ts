import { z } from "zod";

export const CreateNotificationSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  message: z.string().trim().min(1, "message is required"),
  documentId: z.string().optional(),
  reminderId: z.string().optional(),
});

export const UpdateNotificationReadStatusSchema = z.object({
  isRead: z.boolean(),
});
