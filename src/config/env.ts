import z from "zod";
import dotenv from "dotenv";
import { roleValues } from "../constants/roles";
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  DB_URL: z
    .string()
    .default("mongodb+srv://hridoy:1234@practice0.qsptr89.mongodb.net"),
  NODE_ENV: z.string().default("development"),

  CLIENT_URLS: z.string().default("http://localhost:5173"),

  SALT_ROUNDS: z.coerce.number().default(10),

  JWT_ACCESS_SECRET: z.string().min(1, "Access token secret required"),
  JWT_REFRESH_SECRET: z.string().min(1, "Refresh token secret required"),

  JWT_ACCESS_EXPIRY: z.string().default("7d"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),

  GMAIL_USER: z.string().optional(),
  GMAIL_PASS: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),
  S3_BUCKET_REGION: z.string().optional(),
  AWS_ACCESS_KEY: z.string().optional(),
  AWS_SECRET_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  ENABLE_REMINDER_SCHEDULER: z.coerce.boolean().default(true),
  REMINDER_SCHEDULER_INTERVAL_MS: z.coerce.number().default(60000),
  SEED_ADMIN_ON_STARTUP: z.coerce.boolean().default(true),
  SEED_ADMIN_FULL_NAME: z.string().default("Super Admin"),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_ADMIN_ROLE: z.enum(roleValues).default("superadmin"),
});

export const env = envSchema.parse(process.env);
