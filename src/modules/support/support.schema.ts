import { z } from "zod";

export const CreateSupportSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
});

export const UpdateSupportStatusSchema = z.object({
  status: z.enum(["open", "in-progress", "resolved"]),
  resolutionNote: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.status === "resolved" && !data.resolutionNote?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["resolutionNote"],
      message: "Resolution note is required when resolving a report",
    });
  }
});

export const ResolveSupportReportSchema = z.object({
  resolutionNote: z.string().trim().min(1, "Resolution note is required"),
});
