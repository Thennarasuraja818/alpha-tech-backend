import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters long"),
});
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const loginAdminSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: z.string().min(4, "Password must be at least 4 characters long"),
}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: "Either email or phone number is required",
    path: ["email"],
  }
);

export type LoginAdminInput = z.infer<typeof loginAdminSchema>;

// Password reset/change schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(4, "Password must be at least 4 characters long"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(4, "Old password must be at least 4 characters long"),
  newPassword: z.string().min(4, "New password must be at least 4 characters long"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const checkMobileNumberSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number")
});
export type CheckMobileNumberInput = z.infer<typeof checkMobileNumberSchema>;

export const changePasswordByUserIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(4, "New password must be at least 4 characters long"),
});
export type ChangePasswordByUserIdInput = z.infer<typeof changePasswordByUserIdSchema>;