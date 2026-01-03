import { Types } from "mongoose";
import OTPModel from "./otp.model";

export class AuthRepository {
  createOtp = async (email: string, otp: number, expiresAt: Date) => {
    const record = await OTPModel.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );
    return record;
  };

  matchOtp = async (email: string, otp: number) => {
    const record = await OTPModel.findOne({ email, otp });
    return record;
  };

  deleteOtp = async (id: Types.ObjectId) => {
    const record = await OTPModel.findOneAndDelete({ _id: id });
    return record;
  };
}
