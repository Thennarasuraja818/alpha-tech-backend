import { z } from "zod";

export const createWholesalerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().optional(),
    phone: z.string().min(1, "Phone Number is required"),
    createdBy: z.string().optional(),
    modifiedBy: z.string().optional(),
    customerType: z.string().nonempty().min(1, 'Customer type is required'),
    companyName: z.string().nonempty().min(1, 'CompanyName name is required'),
    contactPersonName: z.string().nonempty().min(1, 'Contact person is required'),
    designation: z.string().nonempty().min(1, 'Designation is required'),
    mobileNumber: z.string().optional(),
    // address: z.string().nonempty(),
    address: z.object({
        country: z.string().min(1, "Country is required").default("India"),
        state: z.string().min(1, "State is required"),
        city: z.string().optional(),
        addressLine: z.string().optional(),
        postalCode: z.string().optional()
    }),
    // location: z.string().optional(),
    gstNumber: z.string().optional(),
    // creditLimit: z.string().nonempty().min(1, 'Credit limit is required'),
    // creditPeriod: z.string().nonempty().min(1, 'Credit period is required'),
    creditLimit: z.any(),
    creditPeriod: z.any(),
    otp: z.string().optional(),
    docProof: z.any().optional(),
    Id: z.string().optional(),
    guestUserId: z.string().optional(),
    paymentTerm: z.string().optional(),
    preferredPaymentMode: z.string().optional(),
    discount: z.string().optional(),
    shopType: z.string().nonempty(),
    isActive: z.boolean().optional(),
    // currentShopLocation: z.string().optional(),
    shopImage: z.any().optional(),
    location: z.object({
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        address: z.string().optional()
    }).optional(),

});

export type CreateWholesaler = z.infer<typeof createWholesalerSchema>;

// OTP verification request
export const otpVerificationSchema = z.object({
    phone: z.string().nonempty(),
    otp: z.string().length(4, "OTP must be 4 digits"),
});
export type OtpVerification = z.infer<typeof otpVerificationSchema>;

// Update PIN request
export const addPinSchema = z.object({
    phone: z.string().nonempty(),
    pin: z.string().length(4, "PIN must be exactly 4 digits"),
});
export type AddPin = z.infer<typeof addPinSchema>;

// Login request
export const mobileLoginSchema = z.object({
    phone: z.string().nonempty(),
    fcmToken: z.string().optional(),
    pin: z.string().length(4, "PIN must be exactly 4 digits"),
});
export type MobileLoginInput = z.infer<typeof mobileLoginSchema>;

export const updateStatusSchema = z.object({
    phone: z.string().nonempty(),
    pin: z.string().length(4, "PIN must be exactly 4 digits"),
    status: z.string().optional()
});
export type StatusUpdate = z.infer<typeof updateStatusSchema>;

export const WholesaleOrderListQuery = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional().default(''),
    id: z.string().optional(),
    type: z.string().optional(),
});
export type WholesaleOrderListQueryParam = z.infer<typeof WholesaleOrderListQuery>;

export const creditUpdate = z.object({
    id: z.string().nonempty(),
    creditLimit: z.number(),
    reason: z.string()
});
export type CreditUpdate = z.infer<typeof creditUpdate>;

export const changePasswordAfterVerificationSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters")
});

export type ChangePasswordAfterVerificationInput = z.infer<typeof changePasswordAfterVerificationSchema>;