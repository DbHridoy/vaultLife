import { Types } from "mongoose";
import User from "./user.model";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { Roles } from "../../constants/roles";

type UserMetricsPeriod = "week" | "month" | "year";

type UserListResult = {
  type: "list";
  data: unknown[];
  total: number;
};

type UserMetricsPoint = {
  key: string;
  label: string;
  total: number;
};

type UserMetricsResult = {
  type: "metrics";
  data: {
    period: UserMetricsPeriod;
    granularity: "day" | "month";
    range: {
      start: string;
      end: string;
    };
    totalUsers: number;
    chart: UserMetricsPoint[];
  };
};

const USER_METRICS_QUERY_KEYS = new Set(["metrics", "period", "year", "month", "date"]);

export class UserRepository {
  constructor(private buildDynamicSearch: any) {}

  private buildListQuery = (query: Record<string, unknown>) => {
    return Object.fromEntries(
      Object.entries(query).filter(([key]) => !USER_METRICS_QUERY_KEYS.has(key))
    );
  };

  private isMetricsQuery = (query: Record<string, unknown>) => {
    return String(query.metrics).toLowerCase() === "true";
  };

  private resolveMetricsPeriod = (query: Record<string, unknown>): UserMetricsPeriod => {
    const period = String(query.period ?? "year").toLowerCase();

    if (period === "week" || period === "month" || period === "year") {
      return period;
    }

    throw new apiError(400, "period must be one of: week, month, year");
  };

  private parsePositiveInteger = (value: unknown, fieldName: string) => {
    if (value === undefined) {
      return undefined;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new apiError(400, `${fieldName} must be a positive integer`);
    }

    return parsedValue;
  };

  private buildMetricsRange = (query: Record<string, unknown>, period: UserMetricsPeriod) => {
    const now = new Date();

    if (period === "year") {
      const selectedYear = this.parsePositiveInteger(query.year, "year") ?? now.getUTCFullYear();
      const start = new Date(Date.UTC(selectedYear, 0, 1));
      const end = new Date(Date.UTC(selectedYear + 1, 0, 1));

      return {
        period,
        granularity: "month" as const,
        start,
        end,
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
      };
    }

    if (period === "month") {
      const selectedYear = this.parsePositiveInteger(query.year, "year") ?? now.getUTCFullYear();
      const selectedMonth = this.parsePositiveInteger(query.month, "month") ?? now.getUTCMonth() + 1;

      if (selectedMonth < 1 || selectedMonth > 12) {
        throw new apiError(400, "month must be between 1 and 12");
      }

      const start = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
      const end = new Date(Date.UTC(selectedYear, selectedMonth, 1));
      const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();

      return {
        period,
        granularity: "day" as const,
        start,
        end,
        labels: Array.from({ length: daysInMonth }, (_, index) => String(index + 1)),
      };
    }

    const dateValue = query.date ? new Date(String(query.date)) : now;
    if (Number.isNaN(dateValue.getTime())) {
      throw new apiError(400, "date must be a valid ISO date");
    }

    const utcDay = dateValue.getUTCDay();
    const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay;
    const start = new Date(
      Date.UTC(
        dateValue.getUTCFullYear(),
        dateValue.getUTCMonth(),
        dateValue.getUTCDate() + diffToMonday
      )
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);

    return {
      period,
      granularity: "day" as const,
      start,
      end,
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    };
  };

  private getUserMetrics = async (query: Record<string, unknown>): Promise<UserMetricsResult> => {
    const period = this.resolveMetricsPeriod(query);
    const metricsRange = this.buildMetricsRange(query, period);
    const baseMatch = {
      role: { $ne: "superadmin" },
      createdAt: {
        $gte: metricsRange.start,
        $lt: metricsRange.end,
      },
    };

    let chart: UserMetricsPoint[] = [];

    if (period === "year") {
      const aggregation = await User.aggregate<{ _id: number; total: number }>([
        { $match: baseMatch },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const totalsByMonth = new Map(aggregation.map((item) => [item._id, item.total]));
      chart = metricsRange.labels.map((label, index) => ({
        key: String(index + 1),
        label,
        total: totalsByMonth.get(index + 1) ?? 0,
      }));
    } else if (period === "month") {
      const aggregation = await User.aggregate<{ _id: number; total: number }>([
        { $match: baseMatch },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const totalsByDay = new Map(aggregation.map((item) => [item._id, item.total]));
      chart = metricsRange.labels.map((label, index) => ({
        key: label,
        label,
        total: totalsByDay.get(index + 1) ?? 0,
      }));
    } else {
      const aggregation = await User.aggregate<{ _id: number; total: number }>([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $add: [
                {
                  $mod: [
                    {
                      $add: [{ $dayOfWeek: "$createdAt" }, 5],
                    },
                    7,
                  ],
                },
                1,
              ],
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const totalsByWeekday = new Map(aggregation.map((item) => [item._id, item.total]));
      chart = metricsRange.labels.map((label, index) => ({
        key: String(index + 1),
        label,
        total: totalsByWeekday.get(index + 1) ?? 0,
      }));
    }

    const totalUsers = chart.reduce((sum, point) => sum + point.total, 0);

    return {
      type: "metrics",
      data: {
        period,
        granularity: metricsRange.granularity,
        range: {
          start: metricsRange.start.toISOString(),
          end: metricsRange.end.toISOString(),
        },
        totalUsers,
        chart,
      },
    };
  };

  createUser = async (userBody: any) => {
    const newUser = new User(userBody);
    return await newUser.save();
  };

  getAllUsers = async (query: Record<string, unknown>): Promise<UserListResult | UserMetricsResult> => {
    if (this.isMetricsQuery(query)) {
      return await this.getUserMetrics(query);
    }

    const listQuery = this.buildListQuery(query);
    const { filter, search, options } = this.buildDynamicSearch(User, listQuery);

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

    return { type: "list", data: users, total };
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

  findAdminUsers = async () => {
    return await User.find({
      role: { $in: [Roles.Admin, Roles.SuperAdmin] },
      isBlocked: false,
    });
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
