import { Mailer } from "../../utils/mailer-utils";
import { PushNotifier } from "../../utils/push-notifier";
import { NotificationRepository } from "./notification.repository";
import { UserRepository } from "../user/user.repository";
import { ReminderRepository } from "../reminder/reminder.repository";
import { DocumentRepository } from "../document/document.repository";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { createNotificationType } from "./notification.type";

export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private userRepository: UserRepository,
    private reminderRepository: ReminderRepository,
    private documentRepository: DocumentRepository,
    private mailer: Mailer,
    private pushNotifier: PushNotifier
  ) {}

  private buildStatus(emailDelivered: boolean, pushDelivered: boolean) {
    if (emailDelivered && pushDelivered) {
      return "sent";
    }

    if (emailDelivered || pushDelivered) {
      return "partial";
    }

    return "failed";
  }

  async sendNotificationToUser(
    userId: string,
    payload: createNotificationType,
    metadata: Record<string, unknown> = {}
  ) {
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }

    if (payload.documentId) {
      const document = await this.documentRepository.getDocumentById(payload.documentId);
      if (!document) {
        throw new apiError(Errors.NotFound.code, "Document not found");
      }
    }

    if (payload.reminderId) {
      const reminder = await this.reminderRepository.getReminderById(payload.reminderId);
      if (!reminder) {
        throw new apiError(Errors.NotFound.code, "Reminder not found");
      }
    }

    const channelsRequested = {
      email: Boolean(user.notificationPreferences?.email),
      push: Boolean(user.notificationPreferences?.push),
    };

    let emailDelivered = false;
    let pushDelivered = false;

    if (channelsRequested.email && user.email) {
      await this.mailer.sendNotification(user.email, payload.title, payload.message);
      emailDelivered = true;
    }

    const pushToken = user.pushNotificationToken;
    if (channelsRequested.push && pushToken) {
      await this.pushNotifier.sendPush(pushToken, payload.title, payload.message, {
        documentId: payload.documentId,
        reminderId: payload.reminderId,
        ...metadata,
      });
      pushDelivered = true;
    }

    const status = this.buildStatus(emailDelivered, pushDelivered);

    return await this.notificationRepository.createNotification({
      userId,
      documentId: payload.documentId,
      reminderId: payload.reminderId,
      title: payload.title,
      message: payload.message,
      channelsRequested,
      channelsDelivered: {
        email: emailDelivered,
        push: pushDelivered,
      },
      status,
      sentAt: emailDelivered || pushDelivered ? new Date() : undefined,
      metadata,
    });
  }

  async getMyNotifications(userId: string) {
    return await this.notificationRepository.getUserNotifications(userId);
  }

  async processDueReminders() {
    const reminders = await this.reminderRepository.getDuePendingReminders();
    const results = [];

    for (const reminder of reminders) {
      const document = reminder.documentId as {
        _id: { toString(): string };
        originalName?: string;
      } | null;
      const title = "Document reminder";
      const message = reminder.message
        ? reminder.message
        : `Reminder for document ${document?.originalName || "document"}`;

      const notification = await this.sendNotificationToUser(
        reminder.userId.toString(),
        {
          title,
          message,
          documentId: document?._id.toString(),
          reminderId: reminder._id.toString(),
        },
        {
          remindAt: reminder.remindAt,
        }
      );

      await this.reminderRepository.markReminderAsSent(reminder._id.toString());
      results.push(notification);
    }

    return results;
  }
}
