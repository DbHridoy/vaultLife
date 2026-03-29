import { z } from "zod";

const ReminderRecurrenceSchema = z.enum(["none", "monthly", "yearly"]);

const ReminderNotificationChannelsSchema = z
  .object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
  })
  .refine((data) => data.email === true || data.push === true, {
    message: "At least one notification channel must be enabled",
  });

export const CreateReminderSchema = z.object({
  documentId: z.string().min(1, "documentId is required"),
  remindAt: z.coerce.date(),
  title: z.string().trim().min(1, "title is required"),
  message: z.string().trim().optional(),
  recurrence: ReminderRecurrenceSchema.default("none"),
  notificationChannels: ReminderNotificationChannelsSchema.default({
    email: true,
    push: true,
  }),
});

export const UpdateReminderSchema = z
  .object({
    remindAt: z.coerce.date().optional(),
    title: z.string().trim().min(1, "title cannot be empty").optional(),
    message: z.string().trim().optional(),
    recurrence: ReminderRecurrenceSchema.optional(),
    status: z.enum(["pending", "sent", "cancelled"]).optional(),
    notificationChannels: ReminderNotificationChannelsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
