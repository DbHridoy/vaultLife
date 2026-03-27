import z from "zod";
import {
  AdminUpdateUserSchema,
  CreateUserSchema,
  UpdateNotificationPreferencesSchema,
  UpdateOwnProfileSchema,
} from "./user.schema";

export type updateOtherRoleUserType = z.infer<typeof AdminUpdateUserSchema>;
export type createUserType=z.infer<typeof CreateUserSchema>
export type updateOwnProfileType = z.infer<typeof UpdateOwnProfileSchema>;
export type updateNotificationPreferencesType = z.infer<
  typeof UpdateNotificationPreferencesSchema
>;
