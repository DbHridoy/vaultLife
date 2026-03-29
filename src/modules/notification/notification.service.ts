import { Mailer } from "../../utils/mailer-utils";
import { PushNotifier } from "../../utils/push-notifier";
import { NotificationRepository } from "./notification.repository";
import { UserRepository } from "../user/user.repository";
import { ReminderRepository } from "../reminder/reminder.repository";
import { DocumentRepository } from "../document/document.repository";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import {
  createNotificationType,
  updateNotificationReadStatusType,
} from "./notification.type";

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

  private resolveRequestedChannels(
    user: {
      notificationPreferences?: { email?: boolean; push?: boolean } | null;
    },
    requestedChannels?: { email?: boolean; push?: boolean } | null
  ) {
    return {
      email:
        Boolean(user.notificationPreferences?.email) &&
        (requestedChannels?.email ?? true),
      push:
        Boolean(user.notificationPreferences?.push) &&
        (requestedChannels?.push ?? true),
    };
  }

  private getNextReminderOccurrence(
    remindAt: Date,
    recurrence: "none" | "monthly" | "yearly" | null | undefined
  ) {
    if (!recurrence || recurrence === "none") {
      return null;
    }

    const now = new Date();
    const nextRemindAt = new Date(remindAt);

    while (nextRemindAt <= now) {
      if (recurrence === "monthly") {
        nextRemindAt.setUTCMonth(nextRemindAt.getUTCMonth() + 1);
      } else {
        nextRemindAt.setUTCFullYear(nextRemindAt.getUTCFullYear() + 1);
      }
    }

    return nextRemindAt;
  }

  async sendNotificationToUser(
    userId: string,
    payload: createNotificationType,
    metadata: Record<string, unknown> = {},
    requestedChannels?: { email?: boolean; push?: boolean } | null
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

    const channelsRequested = this.resolveRequestedChannels(user, requestedChannels);

    let emailDelivered = false;
    let pushDelivered = false;

    if (channelsRequested.email && user.email) {
      try {
        await this.mailer.sendNotification(user.email, payload.title, payload.message);
        emailDelivered = true;
      } catch (_error) {
        emailDelivered = false;
      }
    }

    const pushToken = user.pushNotificationToken;
    if (channelsRequested.push && pushToken) {
      try {
        await this.pushNotifier.sendPush(pushToken, payload.title, payload.message, {
          documentId: payload.documentId,
          reminderId: payload.reminderId,
          ...metadata,
        });
        pushDelivered = true;
      } catch (_error) {
        pushDelivered = false;
      }
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
      isRead: false,
      readAt: null,
      metadata,
    });
  }

  async getMyNotifications(userId: string) {
    return await this.notificationRepository.getUserNotifications(userId);
  }

  async updateMyNotificationReadStatus(
    notificationId: string,
    userId: string,
    payload: updateNotificationReadStatusType
  ) {
    const notification =
      await this.notificationRepository.updateUserNotificationReadStatus(
        notificationId,
        userId,
        payload.isRead
      );

    if (!notification) {
      throw new apiError(Errors.NotFound.code, "Notification not found");
    }

    return notification;
  }

  async notifyAdmins(
    payload: createNotificationType,
    metadata: Record<string, unknown> = {},
    requestedChannels?: { email?: boolean; push?: boolean } | null
  ) {
    const admins = await this.userRepository.findAdminUsers();

    const results = await Promise.all(
      admins.map((admin) =>
        this.sendNotificationToUser(
          admin._id.toString(),
          payload,
          metadata,
          requestedChannels
        )
      )
    );

    return results;
  }

  async processDueReminders() {
    const reminders = await this.reminderRepository.getDuePendingReminders();
    const results = [];

    for (const reminder of reminders) {
      const document = reminder.documentId as {
        _id: { toString(): string };
        originalName?: string;
      } | null;
      const title = reminder.title?.trim()
        ? reminder.title
        : "Document reminder";
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
        },
        reminder.notificationChannels
      );

      const nextRemindAt = this.getNextReminderOccurrence(
        reminder.remindAt,
        reminder.recurrence
      );

      if (nextRemindAt) {
        await this.reminderRepository.rescheduleReminder(
          reminder._id.toString(),
          nextRemindAt
        );
      } else {
        await this.reminderRepository.markReminderAsSent(reminder._id.toString());
      }
      results.push(notification);
    }

    return results;
  }
}
