import { Schema, model } from "mongoose";

const commonSchema = new Schema(
  {
    aboutUs: {
      type: String,
      required: true,
      trim: true,
    },
    termsAndCondition: {
      type: String,
      required: true,
      trim: true,
    },
    privacyPolicy: {
      type: String,
      required: true,
      trim: true,
    },
    // Backward compatibility for older records before the field rename.
    servicePolicy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Common = model("Common", commonSchema);

export default Common;
