import bcrypt from "bcrypt";
import { env } from "../config/env";

export  class HashUtils {
  private saltRounds = env.SALT_ROUNDS;

  hashPassword(password: string) {
    return bcrypt.hash(password, this.saltRounds);
  }

  verifyPassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
