// src/middleware/upload.middleware.ts
import multer from "multer";

const storage = multer.memoryStorage(); // keeps files in memory before uploading to S3

export const upload = multer({ storage });