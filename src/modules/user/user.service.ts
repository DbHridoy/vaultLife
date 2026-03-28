import { UserRepository } from "./user.repository";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { HashUtils } from "../../utils/hash-utils";
import { Mailer } from "../../utils/mailer-utils";
import {
  createUserType,
  updateOtherRoleUserType,
  updateOwnProfileType,
} from "./user.type";
import { Roles } from "../../constants/roles";
import { NotificationService } from "../notification/notification.service";

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private hashUtils: HashUtils,
    private mailer: Mailer,
    private notificationService: NotificationService
  ) {}

  private buildUserUpdatePayload = (
    body: Partial<updateOwnProfileType> & { profileImage?: string }
  ) => {
    const updatePayload = {
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.phoneNumber !== undefined ? { phoneNumber: body.phoneNumber } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.country !== undefined ? { country: body.country } : {}),
      ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth } : {}),
      ...(body.profileImage !== undefined ? { profileImage: body.profileImage } : {}),
    };

    if (Object.keys(updatePayload).length === 0) {
      throw new apiError(Errors.NotFound.code, "No valid profile fields provided");
    }

    return updatePayload;
  };

  private buildAdminUserUpdatePayload = (
    body: Partial<updateOtherRoleUserType> & { profileImage?: string }
  ) => {
    const profilePayload = {
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.phoneNumber !== undefined ? { phoneNumber: body.phoneNumber } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.country !== undefined ? { country: body.country } : {}),
      ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth } : {}),
      ...(body.profileImage !== undefined ? { profileImage: body.profileImage } : {}),
    };

    const updatePayload = {
      ...profilePayload,
      ...(body.isBlocked !== undefined
        ? {
            isBlocked: body.isBlocked,
            blockedAt: body.isBlocked ? new Date() : null,
          }
        : {}),
    };

    if (Object.keys(updatePayload).length === 0) {
      throw new apiError(Errors.NotFound.code, "No valid user fields provided");
    }

    return updatePayload;
  };

  getUserProfile = async (id: string) => {
    return await this.userRepo.findUserById(id);
  };
  updateProfile = async (id: string, body: updateOwnProfileType & { profileImage?: string }) => {
    const updatePayload = this.buildUserUpdatePayload(body);
    return await this.userRepo.updateProfile(id, updatePayload);
  };
  updateUser = async (
    id: string,
    body: updateOtherRoleUserType & { profileImage?: string }
  ) => {
    const updatePayload = this.buildAdminUserUpdatePayload(body);
    return await this.userRepo.updateUser(id, updatePayload);
  };
  createUser = async (
    actor: { userId: string; role: string },
    userBody: createUserType
  ) => {
    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this email"
      );
    }

    if (
      (userBody.role === Roles.Admin || userBody.role === Roles.SuperAdmin) &&
      actor.role !== Roles.SuperAdmin
    ) {
      throw new apiError(
        Errors.Forbidden.code,
        "Only superadmin can create admin or superadmin accounts"
      );
    }

    const hashedPassword = await this.hashUtils.hashPassword(userBody.password);

    const user = {
      ...userBody,
      password: hashedPassword,
    };

    const newUser = await this.userRepo.createUser(user);
    //await this.mailerUtils.sendPassword(userBody.email, userBody.password);
    await this.notificationService.notifyAdmins(
      {
        title: "New user created",
        message: `${newUser.fullName} was created with ${newUser.email}.`,
      },
      {
        event: "user_created",
        createdByUserId: actor.userId,
        createdUserId: newUser._id.toString(),
        createdUserEmail: newUser.email,
        createdUserRole: newUser.role,
      }
    );

    return newUser;
  };
  getAllUsers = async (query: Record<string, unknown>) => {
    return await this.userRepo.getAllUsers(query);
  };
  getUserById = async (id: string) => {
    return await this.userRepo.findUserById(id);
  };
  getSalesReps = async (query: any) => {
    return await this.userRepo.getSalesReps(query);
  };
  deleteUser = async (id: string) => {
    return await this.userRepo.deleteUser(id);
  };
  updateNotificationPreferences = async (
    id: string,
    preferences: {
      email: boolean;
      push: boolean;
      pushNotificationToken?: string;
    }
  ) => {
    return await this.userRepo.updateNotificationPreferences(id, preferences);
  };
}
