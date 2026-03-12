import { Schema, model } from "mongoose";
import { roleValues } from "../../constants/roles";

const userSchema = new Schema({
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
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  profileImage:{
    type: String,
  },
  phoneNumber:{
    type:String,
  },
  address:{
    type:String,
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
});

const User = model("User", userSchema);

export default User;
