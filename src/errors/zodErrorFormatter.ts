import { ZodError } from "zod";

export const formatZodError = (error: ZodError) => {
  return error.issues.map(issue => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
    expected: (issue as any).expected, // some issues have these fields
    received: (issue as any).received,
  }));
};
