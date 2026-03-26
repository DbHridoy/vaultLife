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
  dateOfBirth: z.coerce.date(),
  country: z.string(),
});

const UserProfileFieldsSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  dateOfBirth: z.coerce.date().optional(),
  profileImage: z.string().trim().url().optional(),
});

export const UpdateUserSchemaForOtherRoles = UserProfileFieldsSchema.refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  }
);

export const UpdateOwnProfileSchema = UserProfileFieldsSchema
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const CreateUserSchema = UserSchema.omit({
  phoneNumber: true,
  address: true,
  profileImage: true,
  dateOfBirth: true,
  country: true,
}).partial({
  cluster: true,
});

export const UpdateNotificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  pushNotificationToken: z.string().trim().optional(),
});
