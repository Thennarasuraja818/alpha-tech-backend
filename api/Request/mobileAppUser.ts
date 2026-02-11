import { z } from "zod";

export const createMobileUserSchema = z.object({
    name: z.string().optional(),
    userName: z.string().min(1, "Username is required"),
    email: z.string().optional(),
    phone: z.string().optional(),
    mobileNumber: z.string().min(1, "Mobile number is required"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    country: z.string().optional(),
    preferredLanguage: z.string().optional(),
    guestUserId: z.string().optional(),
    lastName: z.string().optional(),
    pincode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type CreateUserMobileApp = z.infer<typeof createMobileUserSchema>;

export const loginUserSchema = z.object({
    phone: z.string().optional(),
    pin: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
    guestUserId: z.string().optional(),
    fcmToken: z.string().optional(),
}).refine(data => (data.phone && data.pin) || (data.email && data.password), {
    message: "Either (phone and pin) or (email and password) must be provided",
});
export type MobileLoginInput = z.infer<typeof loginUserSchema>;


export const otpVerificationSchema = z.object({
    phone: z.string().min(1, "Phone is required"),
    otp: z.string().min(1, "OTP is required"),
});

export type OtpVerification = z.infer<typeof otpVerificationSchema>;

export const pinUpdateSchema = z.object({
    phone: z.string().min(1, "Phone is required"),
    pin: z.string().min(1, "Pin is required"),
});

export type AddPin = z.infer<typeof pinUpdateSchema>;

export const forgetPasswordRequestSchema = z.object({
    email: z.string().email("Invalid email").min(1, "Email is required"),
});

export type ForgetPasswordRequest = z.infer<typeof forgetPasswordRequestSchema>;

export const verifyForgetPasswordOtpSchema = z.object({
    email: z.string().email("Invalid email").min(1, "Email is required"),
    otp: z.string().min(4, "OTP must be 4 digits").max(4, "OTP must be 4 digits"),
});

export type VerifyForgetPasswordOtp = z.infer<typeof verifyForgetPasswordOtpSchema>;

export const resetPasswordV2Schema = z.object({
    email: z.string().email("Invalid email").min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type ResetPasswordV2 = z.infer<typeof resetPasswordV2Schema>;
