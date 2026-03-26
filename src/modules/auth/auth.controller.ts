import { CookieOptions, NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { AuthService } from "./auth.service";
import { HttpCodes } from "../../constants/status-codes";
import { Errors } from "../../constants/error-codes";
import { env } from "../../config/env";
import { apiError } from "../../errors/api-error";
import {
  BiometricLoginType,
  DisableBiometricType,
  EnableBiometricType,
} from "./auth.type";

export class AuthController {
  constructor(private authService: AuthService) {}

  private getRefreshCookieOptions(): CookieOptions {
    const isProduction = env.NODE_ENV === "production";

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, this.getRefreshCookieOptions());
  }

  private buildLoginResponse(userPayload: {
    user: any;
    accessToken: string;
    refreshToken: string;
  }) {
    const { password, biometricCredentials, ...safeUser } =
      userPayload.user.toObject();

    return {
      user: safeUser,
      accessToken: userPayload.accessToken,
      refreshToken: userPayload.refreshToken,
    };
  }

  registerUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userBody = req.body;
      const newUser = await this.authService.registerUser(userBody);
      res.status(HttpCodes.Created).json({
        success: true,
        message: "User registered successfully",
        data: newUser,
      });
    }
  );

  loginUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body;
      // logger.info(body, "Login body");
      const user = await this.authService.loginUser(body.email, body.password);
      // logger.info(user, "User from login controller");
      const data = this.buildLoginResponse(user);

      // logger.info({ user }, "User from controller");

      // Backend cookie (login or refresh)
      this.setRefreshTokenCookie(res, user.refreshToken);

      // Response
      res.status(200).json({
        success: true,
        message: "Login successful",
        data,
      });
    }
  );

  enableBiometricLogin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const body = req.body as EnableBiometricType;

      if (!req.user?.userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const result = await this.authService.enableBiometricLogin(
        req.user.userId,
        body
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Face ID login enabled successfully",
        data: result,
      });
    }
  );

  biometricLogin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const body = req.body as BiometricLoginType;
      const authResult = await this.authService.biometricLogin(body);
      const data = this.buildLoginResponse(authResult);

      this.setRefreshTokenCookie(res, authResult.refreshToken);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Face ID login successful",
        data,
      });
    }
  );

  disableBiometricLogin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const body = req.body as DisableBiometricType;

      if (!req.user?.userId) {
        throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
      }

      const result = await this.authService.disableBiometricLogin(
        req.user.userId,
        body
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Face ID login disabled successfully",
        data: result,
      });
    }
  );

  // reset password
  sendOtp = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      const result = await this.authService.sendOtp(email);
      // logger.info(result, "result");
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
      // logger.info(refreshToken, "from auth controller");
      if (!refreshToken) {
        throw new apiError(Errors.NoToken.code, "Refresh token is required");
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Optionally update the cookie with new refresh token
      this.setRefreshTokenCookie(res, result.refreshToken);

      const responseData = {
        ...result,
      };

      res.status(HttpCodes.Ok).json(responseData);
    }
  );

  logout = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      // logger.info(
      //   { cookies: req.cookies },
      //   "Refresh token from auth controller"
      // );
      if (!req.cookies.refreshToken) {
        throw new apiError(Errors.NoToken.code, "Refresh token is required");
      }
      res.clearCookie("refreshToken", this.getRefreshCookieOptions());

      return res.status(HttpCodes.Ok).json({
        success: true,
        message: "Logged out successfully",
      });
    }
  );
}
