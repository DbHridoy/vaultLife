import { createUserSchema } from "./auth.schema";
import { z } from "zod";

export type createUserType= z.infer<typeof createUserSchema>