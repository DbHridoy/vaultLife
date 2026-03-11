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
    servicePolicy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Common = model("Common", commonSchema);

export default Common;
