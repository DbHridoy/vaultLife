import { Types } from "mongoose";
import User from "./user.model";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";

export class UserRepository {
  constructor(private buildDynamicSearch: any) {}
  createUser = async (userBody: any) => {
    const newUser = new User(userBody);
    return await newUser.save();
  };

  getAllUsers = async (query: any) => {
    const { filter, search, options } = this.buildDynamicSearch(User, query);

    const baseQuery = {
      role: { $ne: "superadmin" },
      ...filter,
      ...search,
    };

    // Run both queries concurrently
    const [users, total] = await Promise.all([
      User.find(baseQuery, null, options),
      User.countDocuments(baseQuery),
    ]);

    return { data: users, total };
  };

  deleteUser = async (id: string) => {
    return await User.findByIdAndDelete(id);
  };

  findUserById = async (id: string) => {
    return await User.findById(id);
  };

  findUserByEmail = async (email: string) => {
    return await User.findOne({ email });
  };

  updateUserPassword = async (id: Types.ObjectId, hashedPassword: string) => {
    return await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
  };

  updateProfile = async (id: string, body: any) => {
    return await User.findByIdAndUpdate(id, body, { new: true });
  };

  getSalesReps = async (query: any) => {
    const { filter, search, options } = this.buildDynamicSearch(User, query);

    const baseQuery = {
      role: { $eq: "admin" },
      ...filter,
      ...search,
    };

    // Run both queries concurrently
    const [salesReps, total] = await Promise.all([
      User.find(baseQuery, null, options),
      User.countDocuments(baseQuery),
    ]);

    return { data: salesReps, total };
  };

  updateUser = async (id: string, body: any) => {
    return await User.findByIdAndUpdate(id, body, { new: true });
  };
  
  updateNotificationPreferences = async (
    id: string,
    preferences: {
      email: boolean;
      push: boolean;
      pushNotificationToken?: string;
    }
  ) => {
    return await User.findByIdAndUpdate(
      id,
      {
        notificationPreferences: {
          email: preferences.email,
          push: preferences.push,
        },
        ...(preferences.pushNotificationToken !== undefined
          ? { pushNotificationToken: preferences.pushNotificationToken }
          : {}),
      },
      { new: true }
    );
  };

  upsertBiometricCredential = async (
    userId: string,
    credential: {
      deviceId: string;
      deviceName?: string;
      tokenHash: string;
    }
  ) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
    }

    const existingCredential = user.biometricCredentials?.find(
      (item: { deviceId: string }) => item.deviceId === credential.deviceId
    );

    if (existingCredential) {
      existingCredential.deviceName = credential.deviceName;
      existingCredential.tokenHash = credential.tokenHash;
      existingCredential.enabled = true;
      existingCredential.lastUsedAt = new Date();
    } else {
      user.biometricCredentials.push({
        ...credential,
        enabled: true,
        lastUsedAt: new Date(),
      });
    }

    await user.save();
    return user;
  };

  findBiometricCredential = async (email: string, deviceId: string) => {
    const user = await User.findOne({
      email,
      biometricCredentials: {
        $elemMatch: {
          deviceId,
          enabled: true,
        },
      },
    });

    if (!user) {
      return null;
    }

    const credential = user.biometricCredentials.find(
      (item: { deviceId: string; enabled: boolean }) =>
        item.deviceId === deviceId && item.enabled
    );

    if (!credential) {
      return null;
    }

    return {
      user,
      credential,
    };
  };

  disableBiometricCredential = async (userId: string, deviceId: string) => {
    return await User.findOneAndUpdate(
      { _id: userId, "biometricCredentials.deviceId": deviceId },
      {
        $set: {
          "biometricCredentials.$.enabled": false,
        },
      },
      { new: true }
    );
  };

  touchBiometricCredential = async (userId: string, deviceId: string) => {
    return await User.findOneAndUpdate(
      { _id: userId, "biometricCredentials.deviceId": deviceId },
      {
        $set: {
          "biometricCredentials.$.lastUsedAt": new Date(),
        },
      },
      { new: true }
    );
  };
}
