import { z } from "zod";

export const createMobileUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().optional(),
    phone: z.string().min(1, "Phone is required"),
    guestUserId: z.string().optional(),
    lastName: z.string().optional(),
    pincode: z.string().optional(),
});

export type CreateUserMobileApp = z.infer<typeof createMobileUserSchema>;

export const loginUserSchema = z.object({
    phone: z.string().nonempty(),
    pin: z.string().nonempty(),
    guestUserId: z.string().optional(),
    fcmToken: z.string().optional(),
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
