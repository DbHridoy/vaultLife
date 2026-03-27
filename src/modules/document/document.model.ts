import { Schema, model } from "mongoose";

const documentSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    documentCategory: {
      type: String,
      required: true,
      trim: true,
    },
    extractedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Document = model("Document", documentSchema);

export default Document;
