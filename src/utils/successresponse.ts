export const successResponse = (data: any, message = "Success") => ({
  success: true,
  message,
  data,
});
