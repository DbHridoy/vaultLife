import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { logger } from "./logger";

export class JwtUtils {
  private accessSecret: Secret = env.JWT_ACCESS_SECRET;
  private refreshSecret: Secret = env.JWT_REFRESH_SECRET;
  private accessExpiry = env.JWT_ACCESS_EXPIRY;
  private refreshExpiry = env.JWT_REFRESH_EXPIRY;

  constructor() {}

  generateAccessToken = async (payload: object): Promise<string> => {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    } as SignOptions);
  };

  verifyAccessToken = async (token: string): Promise<JwtPayload | string> => {
    // logger.info({token},"Access token from utils")
    return jwt.verify(token, this.accessSecret);
  };

  generateRefreshToken = async (payload: object): Promise<string> => {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    } as SignOptions);
  };

  verifyRefreshToken = async (token: string): Promise<JwtPayload | string> => {
    const payload = await jwt.verify(token, this.refreshSecret);
    if(!payload || typeof payload === "string") {
      throw new Error("Invalid token from utils");
    }
    return payload;
  };

  generateBothTokens = async (payload: object) => {
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  };
}
