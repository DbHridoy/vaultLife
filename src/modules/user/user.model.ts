import { Schema, model } from "mongoose";
import { roleValues } from "../../constants/roles";

const biometricCredentialSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    deviceName: {
      type: String,
      trim: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const sanitizeUser = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret.password;
  delete ret.biometricCredentials;
  delete ret.__v;
  return ret;
};

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: roleValues,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockedAt: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    country: {
      type: String,
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    pushNotificationToken: {
      type: String,
      trim: true,
    },
    biometricCredentials: {
      type: [biometricCredentialSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: sanitizeUser,
    },
    toObject: {
      transform: sanitizeUser,
    },
  }
);

const User = model("User", userSchema);

export default User;
