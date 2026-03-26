import { z } from 'zod'

export const registerUserSchema = z.object({
    fullName: z.string(),
    email: z.email(),
    password: z.string(),
    confirmPassword: z.string(),
    twoFactorEnabled: z.boolean().default(false),
}).refine((data) => data.password.length >= 6, {
    message: "Password must be at least 6 characters long",
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).transform(({ confirmPassword, ...rest }) => rest);

export const loginUserSchema = z.object({
    email: z.email(),
    password: z.string()
}).refine((data) => data.password.length >= 6, {
    message: "Password must be at least 6 characters long",
});

export const enableBiometricSchema = z.object({
    deviceId: z.string().trim().min(1),
    deviceName: z.string().trim().min(1).optional(),
});

export const biometricLoginSchema = z.object({
    email: z.email(),
    deviceId: z.string().trim().min(1),
    biometricToken: z.string().trim().min(1),
});

export const disableBiometricSchema = z.object({
    deviceId: z.string().trim().min(1),
});
