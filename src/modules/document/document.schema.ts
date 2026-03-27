import { z } from "zod";

export const ConfirmDocumentSchema = z.object({
  draftId: z.string().trim().min(1, "draftId is required"),
  title: z.string().trim().min(1, "title is required"),
  documentCategory: z.string().trim().min(1, "documentCategory is required"),
  extractedData: z.record(z.string(), z.unknown()),
});
