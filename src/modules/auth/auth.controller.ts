import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { logger } from "../../utils/logger";
import { AuthService } from "./auth.service";
import { HttpCodes } from "../../constants/status-codes";
import { Errors } from "../../constants/error-codes";
import { env } from "../../config/env";
import { apiError } from "../../errors/api-error";

export class AuthController {
  constructor(private authService: AuthService) {}

  createUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userBody = req.body;
      logger.info(userBody, "userBody");
      const newUser = await this.authService.createUser(userBody);
      res.status(HttpCodes.Created).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    }
  );

  loginUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body;
      logger.info(body, "Login body");
      const user = await this.authService.loginUser(body.email, body.password);
      logger.info(user, "User from login controller");
      const { password, ...safeUser } = user.user.toObject();

      const data = {
        user: safeUser,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      };

      // logger.info({ user }, "User from controller");

      // Backend cookie (login or refresh)
      res.cookie("refreshToken", user.refreshToken, {
        httpOnly: true,
        secure: true, // HTTP in dev
        sameSite: "none", // POST + GET works cross-port in dev
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // path: "/auth/refresh-token",
      });

      // Response
      res.status(200).json({
        success: true,
        message: "Login successful",
        data,
      });
    }
  );

  // reset password
  sendOtp = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      const result = await this.authService.sendOtp(email);
      logger.info(result, "result");
      res.status(HttpCodes.Ok).json(result);
    }
  );

  verifyOtp = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, otp } = req.body;
      const record = await this.authService.verifyOtp(email, otp);
      return res.status(HttpCodes.Ok).json(record);
    }
  );

  setNewPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, newPassword, confirmPassword } = req.body;

      // Basic validation
      if (!newPassword || !confirmPassword) {
        return res.status(HttpCodes.BadRequest).json({
          success: false,
          message: "All fields are required",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(HttpCodes.BadRequest).json({
          success: false,
          message: "New password and confirm password do not match",
        });
      }

      // Call service
      const result = await this.authService.setNewPassword(email, newPassword);

      return res
        .status(result.success ? HttpCodes.Ok : HttpCodes.BadRequest)
        .json(result);
    }
  );

  refreshToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const refreshToken = req.cookies?.refreshToken;
      logger.info(refreshToken, "from auth controller");
      if (!refreshToken) {
        throw new apiError(Errors.NoToken.code, "Refresh token is required");
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Optionally update the cookie with new refresh token
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: false, // HTTP in dev
        sameSite: "lax", // works on cross-port dev
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/auth/refresh-token",
      });

      const responseData = {
        ...result,
      };

      res.status(HttpCodes.Ok).json(responseData);
    }
  );

  logout = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      logger.info(
        { cookies: req.cookies },
        "Refresh token from auth controller"
      );
      if (!req.cookies.refreshToken) {
        throw new apiError(Errors.NoToken.code, "Refresh token is required");
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      return res.status(HttpCodes.Ok).json({
        success: true,
        message: "Logged out successfully",
      });
    }
  );
}
