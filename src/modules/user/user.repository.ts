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
      role: { $ne: "admin" },
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
      role: { $eq: "sales-rep" },
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
}
