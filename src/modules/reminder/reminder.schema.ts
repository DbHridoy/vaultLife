import { z } from "zod";

export const CreateReminderSchema = z.object({
  documentId: z.string().min(1, "documentId is required"),
  remindAt: z.coerce.date(),
  message: z.string().trim().optional(),
});

export const UpdateReminderSchema = z
  .object({
    remindAt: z.coerce.date().optional(),
    message: z.string().trim().optional(),
    status: z.enum(["pending", "sent", "cancelled"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
