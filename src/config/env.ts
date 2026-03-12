import z from "zod";
import dotenv from "dotenv";
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

  GEMINI_API_KEY: z.string().optional(),
  S3_BUCKET_REGION: z.string().optional(),
  AWS_ACCESS_KEY: z.string().optional(),
  AWS_SECRET_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
});

export const env = envSchema.parse(process.env);
