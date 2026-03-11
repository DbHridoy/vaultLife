import { registerUserSchema } from "./auth.schema";
import { z } from "zod";

export type RegisterUserType = z.infer<typeof registerUserSchema>