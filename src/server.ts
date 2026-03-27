import app from "./app";
import connectDB from "./config/database";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { seedAdmin } from "./seed/admin.seed";
import { notificationService } from "./container";

let isReminderProcessing = false;

const processDueReminders = async () => {
  if (isReminderProcessing) {
    return;
  }

  isReminderProcessing = true;

  try {
    const notifications = await notificationService.processDueReminders();
    if (notifications.length > 0) {
      logger.info(
        { processedCount: notifications.length },
        "Processed due reminder notifications"
      );
    }
  } catch (error) {
    logger.error(error, "Failed to process due reminders");
  } finally {
    isReminderProcessing = false;
  }
};

const startReminderScheduler = () => {
  if (!env.ENABLE_REMINDER_SCHEDULER) {
    logger.info("Reminder scheduler is disabled");
    return;
  }

  const intervalMs = Math.max(env.REMINDER_SCHEDULER_INTERVAL_MS, 10000);
  setInterval(() => {
    void processDueReminders();
  }, intervalMs);
  void processDueReminders();

  logger.info({ intervalMs }, "Reminder scheduler started");
};

const startServer = async () => {
  try {
    await connectDB(env.DB_URL);
    await seedAdmin();
    startReminderScheduler();
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
