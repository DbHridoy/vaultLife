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
import { CommonRepository } from "./modules/common/common.repository";
import { CommonService } from "./modules/common/common.service";
import { CommonController } from "./modules/common/common.controller";
import { DocumentRepository } from "./modules/document/document.repository";
import { DocumentService } from "./modules/document/document.service";
import { DocumentController } from "./modules/document/document.controller";
import { FileAnalyzerAI } from "./utils/file-analyzer-ai";
import { ReminderRepository } from "./modules/reminder/reminder.repository";
import { ReminderService } from "./modules/reminder/reminder.service";
import { ReminderController } from "./modules/reminder/reminder.controller";
import { NotificationRepository } from "./modules/notification/notification.repository";
import { NotificationService } from "./modules/notification/notification.service";
import { NotificationController } from "./modules/notification/notification.controller";
import { PushNotifier } from "./utils/push-notifier";
import { SupportRepository } from "./modules/support/support.repository";
import { SupportService } from "./modules/support/support.service";
import { SupportController } from "./modules/support/support.controller";

export const hashUtils = new HashUtils();
export const jwtUtils = new JwtUtils();
export const mailer = new Mailer();
export const pushNotifier = new PushNotifier();

export const userRepository = new UserRepository(buildDynamicSearch);
export const authRepo = new AuthRepository();
export const fileAnalyzerAI = new FileAnalyzerAI();
export const documentRepository = new DocumentRepository();
export const reminderRepository = new ReminderRepository();
export const notificationRepository = new NotificationRepository();
export const notificationService = new NotificationService(
  notificationRepository,
  userRepository,
  reminderRepository,
  documentRepository,
  mailer,
  pushNotifier
);
export const userService = new UserService(
  userRepository,
  hashUtils,
  mailer,
  notificationService
);
export const userController = new UserController(userService);

export const authService = new AuthService(
  authRepo,
  userRepository,
  hashUtils,
  jwtUtils,
  mailer,
  notificationService
);
export const authMiddleware = new AuthMiddleware(jwtUtils, userRepository);
export const authController = new AuthController(authService);

export const commonRepository = new CommonRepository();
export const commonService = new CommonService(commonRepository);
export const commonController = new CommonController(commonService);

export const documentService = new DocumentService(documentRepository, fileAnalyzerAI);
export const documentController = new DocumentController(documentService);
export const reminderService = new ReminderService(
  reminderRepository,
  documentRepository
);
export const reminderController = new ReminderController(reminderService);
export const notificationController = new NotificationController(
  notificationService
);
export const supportRepository = new SupportRepository();
export const supportService = new SupportService(
  supportRepository,
  notificationService,
  mailer
);
export const supportController = new SupportController(supportService);
