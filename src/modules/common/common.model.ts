import { Schema, model } from "mongoose";

const commonSchema = new Schema(
  {
    aboutUs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    termsAndCondition: {
      type: Schema.Types.Mixed,
      required: true,
    },
    privacyPolicy: {
      type: Schema.Types.Mixed,
      required: true,
    },
    // Backward compatibility for older records before the field rename.
    servicePolicy: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const Common = model("Common", commonSchema);

export default Common;
