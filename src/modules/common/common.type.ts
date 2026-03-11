import { z } from "zod";
import { CreateCommonSchema, UpdateCommonSchema } from "./common.schema";

export type createCommonType = z.infer<typeof CreateCommonSchema>;
export type updateCommonType = z.infer<typeof UpdateCommonSchema>;
