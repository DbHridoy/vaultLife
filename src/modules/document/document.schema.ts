import { z } from "zod";

export const ConfirmDocumentSchema = z.object({
  draftId: z.string().trim().min(1, "draftId is required"),
  title: z.string().trim().min(1, "title is required"),
  documentCategory: z.string().trim().min(1, "documentCategory is required"),
  extractedData: z.record(z.string(), z.unknown()),
});

export const UpdateDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "title cannot be empty").optional(),
    documentCategory: z
      .string()
      .trim()
      .min(1, "documentCategory cannot be empty")
      .optional(),
    extractedData: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.documentCategory !== undefined ||
      value.extractedData !== undefined,
    {
      message: "At least one field must be provided",
    }
  );
