import { UserRepository } from "./user.repository";
import { logger } from "../../utils/logger";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { createUserType } from "./user.type";
import { hashUtils } from "../../container";
import { mailer } from "../../container";
import { HashUtils } from "../../utils/hash-utils";
import { Mailer } from "../../utils/mailer-utils";

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private hashUtils: HashUtils,
    private mailer: Mailer
  ) {}
  getUserProfile = async (id: string) => {
    return await this.userRepo.findUserById(id);
  };
  updateProfile = async (id: string, body: any) => {
    return await this.userRepo.updateProfile(id, body);
  };
updateUser=async(id:string,body:any)=>{
  return await this.userRepo.updateUser(id,body)
}
  createUser = async (userBody: createUserType) => {
    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this email"
      );
    }

    const hashedPassword = await this.hashUtils.hashPassword(userBody.password);

    const user = {
      ...userBody,
      password: hashedPassword,
    };

    const newUser = await this.userRepo.createUser(user);
    //await this.mailerUtils.sendPassword(userBody.email, userBody.password);

    return newUser;
  };
  getAllUsers=async(query:any)=>{
    return await this.userRepo.getAllUsers(query)
  }
  getUserById=async(id:string)=>{
    return await this.userRepo.findUserById(id)
  }
  getSalesReps=async(query:any)=>{
    return await this.userRepo.getSalesReps(query)
  }
  deleteUser=async(id:string)=>{
    return await this.userRepo.deleteUser(id)
  }
}
