import z from "zod";
import { CreateUserSchema, UpdateUserSchemaForOtherRoles } from "./user.schema";

export type updateOtherRoleUserType = z.infer<typeof UpdateUserSchemaForOtherRoles>;
export type createUserType=z.infer<typeof CreateUserSchema>
