import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import {
  CreateUserSchema,
  UpdateNotificationPreferencesSchema,
  UpdateUserSchemaForOtherRoles,
} from "./user.schema";
import { uploadFile } from "../../middlewares/uploadLocal.middleware";
import { authMiddleware, userController } from "../../container";

const userRoute = Router();

// userRoute.use(authMiddleware.authenticate)

userRoute.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.authorize([ "superadmin", "admin" ]),
  validate(CreateUserSchema),
  userController.createUser
);

userRoute.get("/", userController.getAllUsers);
userRoute.get(
  "/me",
  authMiddleware.authenticate,
  userController.getUserProfile
);
userRoute.get("/sales-reps",userController.getSalesReps)
userRoute.get("/:id", userController.getUserById);

userRoute.patch(
  "/me/notification-preferences",
  authMiddleware.authenticate,
  validate(UpdateNotificationPreferencesSchema),
  userController.updateNotificationPreferences
);
userRoute.patch(
  "/me",
  authMiddleware.authenticate, // 1️⃣ auth first
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }), // 2️⃣ parse FormData
  // validate(UpdateUserSchemaForOtherRoles), // 3️⃣ validate text fields
  authMiddleware.authorize(["superadmin", "admin", "user"]),
  userController.updateProfile // 4️⃣ controller
);
userRoute.patch(
  "/:id",
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }), // 2️⃣ parse FormData
  userController.updateUser // 4️⃣ controller
);

userRoute.delete("/:id", userController.deleteUser);

export default userRoute;
