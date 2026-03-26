import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import {
  biometricLoginSchema,
  disableBiometricSchema,
  enableBiometricSchema,
  loginUserSchema,
  registerUserSchema,
} from "./auth.schema";
import { authController, authMiddleware } from "../../container";

const authRoute = Router();


// Register route
authRoute.post(
  "/register",
  validate(registerUserSchema),
  authController.registerUser
);

authRoute.post("/login", validate(loginUserSchema), authController.loginUser);
authRoute.post(
  "/biometric/enable",
  authMiddleware.authenticate,
  validate(enableBiometricSchema),
  authController.enableBiometricLogin
);
authRoute.post(
  "/biometric/login",
  validate(biometricLoginSchema),
  authController.biometricLogin
);
authRoute.post(
  "/biometric/disable",
  authMiddleware.authenticate,
  validate(disableBiometricSchema),
  authController.disableBiometricLogin
);

authRoute.post("/send-otp", authController.sendOtp);
authRoute.post("/verify-otp", authController.verifyOtp);
authRoute.post("/set-new-password", authController.setNewPassword);
authRoute.post("/refresh-token", authController.refreshToken);
authRoute.post("/logout", authController.logout);

export default authRoute;
