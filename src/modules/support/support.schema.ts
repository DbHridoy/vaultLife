import { z } from "zod";

export const CreateSupportSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
});

export const UpdateSupportStatusSchema = z.object({
  status: z.enum(["open", "in-progress", "resolved"]),
});
