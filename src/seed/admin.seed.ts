import { env } from "../config/env";
import { logger } from "../utils/logger";
import User from "../modules/user/user.model";
import { HashUtils } from "../utils/hash-utils";

const hashUtils = new HashUtils();

export const seedAdmin = async () => {
  if (!env.SEED_ADMIN_ON_STARTUP) {
    logger.info("Admin seeding is disabled");
    return;
  }

  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    logger.info(
      "Admin seeding skipped because SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing"
    );
    return;
  }

  const existingAdmin = await User.findOne({ email: env.SEED_ADMIN_EMAIL });

  if (existingAdmin) {
    logger.info(
      { email: env.SEED_ADMIN_EMAIL, role: existingAdmin.role },
      "Seed admin already exists"
    );
    return;
  }

  const hashedPassword = await hashUtils.hashPassword(env.SEED_ADMIN_PASSWORD);

  await User.create({
    fullName: env.SEED_ADMIN_FULL_NAME,
    email: env.SEED_ADMIN_EMAIL,
    password: hashedPassword,
    role: env.SEED_ADMIN_ROLE,
  });

  logger.info(
    { email: env.SEED_ADMIN_EMAIL, role: env.SEED_ADMIN_ROLE },
    "Seed admin created successfully"
  );
};
