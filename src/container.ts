import { HashUtils } from "./utils/hash-utils";
import { JwtUtils } from "./utils/jwt-utils";
import { Mailer } from "./utils/mailer-utils";
import { UserRepository } from "./modules/user/user.repository";
import { UserService } from "./modules/user/user.service";
import { UserController } from "./modules/user/user.controller";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthService } from "./modules/auth/auth.service";
import { AuthController } from "./modules/auth/auth.controller";
import { buildDynamicSearch } from "./utils/dynamic-search-utils";

export const hashUtils = new HashUtils();
export const jwtUtils = new JwtUtils();
export const mailer = new Mailer();

export const userRepository = new UserRepository(buildDynamicSearch);
export const userService = new UserService(userRepository, hashUtils, mailer);
export const userController = new UserController(userService);

export const authRepo = new AuthRepository();
export const authService = new AuthService(
  authRepo,
  userRepository,
  hashUtils,
  jwtUtils,
  mailer
);
export const authMiddleware = new AuthMiddleware(jwtUtils, userRepository);
export const authController = new AuthController(authService);


