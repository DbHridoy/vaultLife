import z from "zod";
import {
  CreateSupportSchema,
  ResolveSupportReportSchema,
  UpdateSupportStatusSchema,
} from "./support.schema";

export type createSupportType = z.infer<typeof CreateSupportSchema>;
export type updateSupportStatusType = z.infer<typeof UpdateSupportStatusSchema>;
export type resolveSupportReportType = z.infer<typeof ResolveSupportReportSchema>;
