import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { apiError } from "../errors/api-error";
import { formatZodError } from "../errors/zodErrorFormatter";
import { logger } from "../utils/logger";
import { TokenExpiredError } from "jsonwebtoken";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message: any;
  let statusCode: number;

  logger.info({ err }, "error");

  if (err instanceof ZodError) {
    statusCode = 400;
    message = formatZodError(err);
    return res.status(statusCode).json({ success: false, message });
  } else if (err instanceof apiError) {
    statusCode = err.statusCode;
    message = err.message;
    return res.status(statusCode).json({ success: false, message });
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token expired";
    return res.status(statusCode).json({ success: false, message });
  } else {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
