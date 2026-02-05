import { z } from "zod";

export const createWebsiteUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required")
  // userName: z.string().min(1, "User name is required"),
  // password: z.string().min(6, "Password must be at least 6 characters long"),
});
export type CreateUserInput = z.infer<typeof createWebsiteUserSchema>;

// export const loginWebsiteUserSchema = z.object({
//   email: z.string().email("Invalid email address"),
//   password: z.string().min(6, "Password must be at least 6 characters long"),
// });

export const loginWebsiteUserSchema = z.object({
    phone: z.string().nonempty(),
    pin: z.string().nonempty(),
});
export type LoginWebsiteInput = z.infer<typeof loginWebsiteUserSchema>;

// Password reset/change schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(6, "Old password must be at least 6 characters long"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters long"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
