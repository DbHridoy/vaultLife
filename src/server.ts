import app from "./app";
import connectDB from "./config/database";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const startServer = async () => {
  try {
    await connectDB(env.DB_URL);
    app.listen(env.PORT, () => {
      logger.info(
        `Server is running on port http://localhost:${env.PORT}/api/v1`
      );
    });
  } catch (error) {
    logger.error(error,"Failed to start the server:")
    process.exit(1);
  }
};
startServer();
