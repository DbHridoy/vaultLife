import { z } from "zod";

export const CreateCommonSchema = z.object({
  aboutUs: z.string().trim().min(1, "About us is required"),
  termsAndCondition: z
    .string()
    .trim()
    .min(1, "Terms and condition is required"),
  servicePolicy: z.string().trim().min(1, "Service policy is required"),
});

export const UpdateCommonSchema = CreateCommonSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  }
);
