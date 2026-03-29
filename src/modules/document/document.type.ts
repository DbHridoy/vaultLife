import { z } from "zod";
import { ConfirmDocumentSchema, UpdateDocumentSchema } from "./document.schema";

export type confirmDocumentType = z.infer<typeof ConfirmDocumentSchema>;
export type updateDocumentType = z.infer<typeof UpdateDocumentSchema>;

export type DocumentListQuery = {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
  title?: string;
  originalName?: string;
  mimeType?: string;
  documentCategory?: string;
  uploadedBy?: string;
  [key: string]: unknown;
};

export type DocumentListResult = {
  data: unknown[];
  total: number;
};
