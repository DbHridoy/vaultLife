import Reminder from "./reminder.model";

type ReminderListFilter = "all" | "upcoming" | "overdue";

export class ReminderRepository {
  createReminder = async (payload: Record<string, unknown>) => {
    const reminder = new Reminder(payload);
    return await reminder.save();
  };

  getUserReminders = async (userId: string, filter: ReminderListFilter = "all") => {
    const now = new Date();
    const query: Record<string, unknown> = { userId };

    if (filter === "upcoming") {
      query.status = "pending";
      query.remindAt = { $gte: now };
    }

    if (filter === "overdue") {
      query.status = "pending";
      query.remindAt = { $lt: now };
    }

    return await Reminder.find(query)
      .populate("documentId")
      .sort({ remindAt: 1 });
  };

  getReminderById = async (id: string) => {
    return await Reminder.findById(id);
  };

  getDuePendingReminders = async () => {
    return await Reminder.find({
      status: "pending",
      remindAt: { $lte: new Date() },
    })
      .populate("documentId")
      .sort({ remindAt: 1 });
  };

  updateReminder = async (id: string, payload: Record<string, unknown>) => {
    return await Reminder.findByIdAndUpdate(id, payload, { new: true });
  };

  markReminderAsSent = async (id: string) => {
    return await Reminder.findByIdAndUpdate(
      id,
      {
        status: "sent",
        sentAt: new Date(),
      },
      { new: true }
    );
  };

  rescheduleReminder = async (id: string, nextRemindAt: Date) => {
    return await Reminder.findByIdAndUpdate(
      id,
      {
        remindAt: nextRemindAt,
        status: "pending",
        sentAt: new Date(),
      },
      { new: true }
    );
  };

  deleteReminder = async (id: string) => {
    return await Reminder.findByIdAndDelete(id);
  };
}
