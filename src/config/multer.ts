import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, _file, callback) =>
    callback(null, Date.now() + path.extname(_file.originalname)),
});
