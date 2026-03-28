import { Schema, model } from "mongoose";

const supportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    resolutionAttachments: {
      type: [
        {
          fileName: {
            type: String,
            trim: true,
          },
          fileUrl: {
            type: String,
            trim: true,
          },
          mimeType: {
            type: String,
            trim: true,
          },
          size: {
            type: Number,
          },
          s3Key: {
            type: String,
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Support = model("Support", supportSchema);

export default Support;
