import z from "zod";
import { roleValues } from "../../constants/roles";

const UserSchema = z.object({
  fullName: z.string(),
  email:z.email(),
  phoneNumber: z.string(),
  address: z.string(),
  cluster: z.string(),
  role: z.enum(roleValues),
  password: z.string(),
  profileImage: z.string(),
});

export const UpdateUserSchemaForOtherRoles = UserSchema.omit({
  role: true,
  cluster: true,
}).partial();

export const CreateUserSchema = UserSchema.omit({
  phoneNumber: true,
  address: true,
  profileImage: true,
}).partial({
  cluster: true,
});

export const UpdateNotificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  pushNotificationToken: z.string().trim().optional(),
});
