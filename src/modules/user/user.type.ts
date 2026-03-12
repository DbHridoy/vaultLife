import z from "zod";
import {
  CreateUserSchema,
  UpdateNotificationPreferencesSchema,
  UpdateUserSchemaForOtherRoles,
} from "./user.schema";

export type updateOtherRoleUserType = z.infer<typeof UpdateUserSchemaForOtherRoles>;
export type createUserType=z.infer<typeof CreateUserSchema>
export type updateNotificationPreferencesType = z.infer<
  typeof UpdateNotificationPreferencesSchema
>;
