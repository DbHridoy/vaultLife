import { z } from "zod";

const commonFieldSchema = z.object({
  aboutUs: z.string().trim().min(1, "About us is required"),
  termsAndCondition: z
    .string()
    .trim()
    .min(1, "Terms and condition is required"),
  privacyPolicy: z.string().trim().min(1, "Privacy policy is required").optional(),
  servicePolicy: z.string().trim().min(1, "Privacy policy is required").optional(),
});

export const CreateCommonSchema = commonFieldSchema
  .refine((data) => Boolean(data.privacyPolicy || data.servicePolicy), {
    message: "Privacy policy is required",
    path: ["privacyPolicy"],
  })
  .transform(({ servicePolicy, privacyPolicy, ...rest }) => ({
    ...rest,
    privacyPolicy: privacyPolicy ?? servicePolicy!,
  }));

export const UpdateCommonSchema = commonFieldSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .transform(({ servicePolicy, privacyPolicy, ...rest }) => ({
    ...rest,
    ...(privacyPolicy || servicePolicy
      ? { privacyPolicy: privacyPolicy ?? servicePolicy }
      : {}),
  }));
