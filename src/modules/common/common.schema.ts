import { z } from "zod";

const richTextHtmlSchema = z.string().min(1, "Content is required");

const commonFieldSchema = z.object({
  aboutUs: richTextHtmlSchema,
  termsAndCondition: richTextHtmlSchema,
  privacyPolicy: richTextHtmlSchema.optional(),
  servicePolicy: richTextHtmlSchema.optional(),
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
