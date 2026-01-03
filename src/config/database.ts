import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async (url: string) => {
  try {
    await mongoose.connect(url);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error(error, "MongoDB connection error:");
    process.exit(1);
  }
};

export default connectDB;
