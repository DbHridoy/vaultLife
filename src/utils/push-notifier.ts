import { logger } from "./logger";

export class PushNotifier {
  async sendPush(
    token: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    // Placeholder integration point for FCM, OneSignal, Expo, etc.
    logger.info(
      {
        token,
        title,
        message,
        data,
      },
      "Push notification dispatched"
    );

    return { success: true };
  }
}
