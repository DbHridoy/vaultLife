import { z } from "zod";
import { ConfirmDocumentSchema } from "./document.schema";

export type confirmDocumentType = z.infer<typeof ConfirmDocumentSchema>;
