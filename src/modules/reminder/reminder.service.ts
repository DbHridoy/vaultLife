import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { ReminderRepository } from "./reminder.repository";
import { DocumentRepository } from "../document/document.repository";
import { createReminderType, updateReminderType } from "./reminder.type";

type ReminderListFilter = "all" | "upcoming" | "overdue";

export class ReminderService {
  constructor(
    private reminderRepository: ReminderRepository,
    private documentRepository: DocumentRepository
  ) {}

  private async ensureDocumentOwnership(documentId: string, userId: string) {
    const document = await this.documentRepository.getDocumentById(documentId);

    if (!document) {
      throw new apiError(Errors.NotFound.code, "Document not found");
    }

    if (document.uploadedBy.toString() !== userId) {
      throw new apiError(Errors.Forbidden.code, "You cannot manage reminders for this document");
    }

    return document;
  }

  private async ensureReminderOwnership(reminderId: string, userId: string) {
    const reminder = await this.reminderRepository.getReminderById(reminderId);

    if (!reminder) {
      throw new apiError(Errors.NotFound.code, "Reminder not found");
    }

    if (reminder.userId.toString() !== userId) {
      throw new apiError(Errors.Forbidden.code, "You cannot access this reminder");
    }

    return reminder;
  }

  createReminder = async (payload: createReminderType, userId: string) => {
    await this.ensureDocumentOwnership(payload.documentId, userId);

    return await this.reminderRepository.createReminder({
      ...payload,
      userId,
      status: "pending",
    });
  };

  getUserReminders = async (userId: string, filter: string = "all") => {
    const normalizedFilter = filter.toLowerCase();

    if (
      normalizedFilter !== "all" &&
      normalizedFilter !== "upcoming" &&
      normalizedFilter !== "overdue"
    ) {
      throw new apiError(400, "filter must be one of: all, upcoming, overdue");
    }

    return await this.reminderRepository.getUserReminders(
      userId,
      normalizedFilter as ReminderListFilter
    );
  };

  updateReminder = async (
    reminderId: string,
    payload: updateReminderType,
    userId: string
  ) => {
    await this.ensureReminderOwnership(reminderId, userId);

    return await this.reminderRepository.updateReminder(reminderId, payload);
  };

  deleteReminder = async (reminderId: string, userId: string) => {
    await this.ensureReminderOwnership(reminderId, userId);

    return await this.reminderRepository.deleteReminder(reminderId);
  };
}
