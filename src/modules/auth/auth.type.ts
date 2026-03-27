import {
  biometricLoginSchema,
  changePasswordSchema,
  disableBiometricSchema,
  enableBiometricSchema,
  registerUserSchema,
} from "./auth.schema";
import { z } from "zod";

export type RegisterUserType = z.infer<typeof registerUserSchema>
export type EnableBiometricType = z.infer<typeof enableBiometricSchema>;
export type BiometricLoginType = z.infer<typeof biometricLoginSchema>;
export type DisableBiometricType = z.infer<typeof disableBiometricSchema>;
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
