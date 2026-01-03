import z from "zod";

const UserSchema = z.object({
  fullName: z.string(),
  email:z.email(),
  phoneNumber: z.string(),
  address: z.string(),
  cluster: z.string(),
  role: z.enum(["admin", "sales-rep", "production-manager"]),
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
