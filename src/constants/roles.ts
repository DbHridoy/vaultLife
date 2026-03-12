export const Roles = {
  SuperAdmin: "superadmin",
  Admin: "admin",
  User: "user",
} as const;

export const roleValues = [Roles.SuperAdmin, Roles.Admin, Roles.User] as const;

export type Role = (typeof roleValues)[number];
