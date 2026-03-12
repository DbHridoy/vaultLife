import { Schema, model } from "mongoose";

const reminderSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "cancelled"],
      default: "pending",
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Reminder = model("Reminder", reminderSchema);

export default Reminder;
