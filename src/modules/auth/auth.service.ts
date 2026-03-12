import { logger } from "../../utils/logger";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import {UserRepository} from "../user/user.repository";
import { RegisterUserType } from "./auth.type";
import { HashUtils } from "../../utils/hash-utils";
import { JwtUtils } from "../../utils/jwt-utils";
import { Mailer } from "../../utils/mailer-utils";
import { Roles } from "../../constants/roles";

export class AuthService {

  constructor(private authRepo: AuthRepository,private userRepo:UserRepository,private hashUtils:HashUtils,private jwtUtils:JwtUtils,private mailerUtils:Mailer) {}

  registerUser = async (userBody: RegisterUserType) => {
    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists"
      );
    }
    const hashedPassword = await this.hashUtils.hashPassword(userBody.password);
    logger.info({ hashedPassword }, "HashedPassword");

    const user = {
      ...userBody,
      role: Roles.User,
      password: hashedPassword,
    };

    logger.info({ user }, "user");

    const newUser = await this.userRepo.createUser(user);
    return newUser;
  };

  loginUser = async (email: string, password: string) => {
    const user = await this.userRepo.findUserByEmail(email);
    logger.info({ user }, "User from service");
    if (!user) {
      throw new apiError(Errors.NotFound.code, 'User not found');
    }

    if (user.twoFactorEnabled) {
      throw new apiError(Errors.Unauthorized.code, 'Two factor authentication is enabled');
    }

    const isVerified = bcrypt.compareSync(password, user.password);
    logger.info({isVerified}, "isVerified");
    if (!isVerified) {
      throw new apiError(Errors.Unauthorized.code, Errors.Unauthorized.message);
    }

    const payload = {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    const accessToken: string = await this.jwtUtils.generateAccessToken(
      payload
    );

    const refreshToken: string = await this.jwtUtils.generateRefreshToken(
      payload
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  };

  async sendOtp(email: string) {
    const user = await this.userRepo.findUserByEmail(email);

    if (!user) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }
    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Save or update OTP in DB

    try {
      const result = this.mailerUtils.sendOtp(email, otp);
      const insertedOtp = await this.authRepo.createOtp(email, otp, expiresAt);
      return {
        success: true,
        data: insertedOtp,
        message: "OTP sent successfully",
      };
    } catch (error) {
      console.error("Email error:", error);
      return { success: false, message: "Failed to send OTP" };
    }
  }

  async verifyOtp(email: string, otp: string) {
    logger.info(`from service layer - email: ${email}, otp: ${otp}`);
    const record = await this.authRepo.matchOtp(email, Number(otp));
    if (!record) {
      return { success: false, message: "Invalid OTP" };
    }

    if (record.expiresAt < new Date()) {
      return { success: false, message: "OTP expired" };
    }

    // Optionally, delete OTP after verification
    await this.authRepo.deleteOtp(record._id);

    return { success: true, message: "OTP verified successfully" };
  }

  async setNewPassword(email: string, newPassword: string) {
    logger.info(
      `from service layer - email: ${email}, newPassword: ${newPassword}`
    );
    // Find user by email
    const user = await this.userRepo.findUserByEmail(email);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Hash new password
    const hashedPassword = await this.hashUtils.hashPassword(newPassword);

    // Update user password
    await this.userRepo.updateUserPassword(user._id, hashedPassword);

    return { success: true, message: "Password updated successfully" };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.jwtUtils.verifyRefreshToken(refreshToken);

    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      throw new apiError(Errors.NoToken.code, "Invalid token payload");
    }

    const user = await this.userRepo.findUserById(payload.userId);

    if (!user) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    const tokenPayload = {
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.jwtUtils.generateBothTokens(tokenPayload);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
