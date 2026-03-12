import z from "zod";
import { CreateReminderSchema, UpdateReminderSchema } from "./reminder.schema";

export type createReminderType = z.infer<typeof CreateReminderSchema>;
export type updateReminderType = z.infer<typeof UpdateReminderSchema>;
