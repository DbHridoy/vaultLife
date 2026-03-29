import Notification from "./notification.model";

export class NotificationRepository {
  createNotification = async (payload: Record<string, unknown>) => {
    const notification = new Notification(payload);
    return await notification.save();
  };

  getUserNotifications = async (userId: string) => {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  };

  updateUserNotificationReadStatus = async (
    notificationId: string,
    userId: string,
    isRead: boolean
  ) => {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      {
        isRead,
        readAt: isRead ? new Date() : null,
      },
      { new: true }
    );
  };
}
