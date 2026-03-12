import Reminder from "./reminder.model";

export class ReminderRepository {
  createReminder = async (payload: Record<string, unknown>) => {
    const reminder = new Reminder(payload);
    return await reminder.save();
  };

  getUserReminders = async (userId: string) => {
    return await Reminder.find({ userId })
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

  deleteReminder = async (id: string) => {
    return await Reminder.findByIdAndDelete(id);
  };
}
