import z from "zod";
import { CreateSupportSchema, UpdateSupportStatusSchema } from "./support.schema";

export type createSupportType = z.infer<typeof CreateSupportSchema>;
export type updateSupportStatusType = z.infer<typeof UpdateSupportStatusSchema>;
