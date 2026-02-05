import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(4, "Password must be at 4 characters long"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  roleId: z.string().min(1, "Role ID is required").refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    { message: "Invalid role ID format" }
  ),
  dateOfJoining: z.coerce.date().optional(),
  dateOfBirth: z.coerce.date().optional(),
  salary: z.coerce.number().nonnegative("Salary must be a positive number").optional(),
  aadhar: z.string()
    .length(12, "Aadhar must be exactly 12 digits")
    .regex(/^\d{12}$/, "Aadhar must contain only digits")
    .optional(),
  isActive: z.boolean().default(true).optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  isDelete: z.boolean().default(false).optional(),
  userId: z.string().optional(),
  salesWithCollection: z.boolean().default(false).optional(),
  orderStatusChangePermission: z.boolean().default(false).optional(),
  cashHandoverUser: z.boolean().default(false).optional(),
  returnOrderCollectedUser: z.boolean().default(false).optional(),
  // New fields
  bloodGroup: z.string().optional(),
  permanentAddress: z.string().optional(),
  presentAddress: z.string().optional(),
  emergencyContactNumber: z.string()
    .optional(),
  relationship: z.string().optional(),
  bankName: z.string().min(1, "Bank Name is required").optional(),
  ifscCode: z.string()
    .optional(),
  branch: z.string().optional(),
  accountNumber: z.string()
    .optional(),
  profileImage: z.string().optional() // For storing image path
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(4, "Password must be at 4 characters long").optional(),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  roleId: z.string().min(1, "Role ID is required").refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    { message: "Invalid role ID format" }
  ),
  dateOfJoining: z.coerce.date().optional(),
  dateOfBirth: z.coerce.date().optional(),
  salary: z.coerce.number().nonnegative("Salary must be a positive number").optional(),
  aadhar: z.string()
    .length(12, "Aadhar must be exactly 12 digits")
    .regex(/^\d{12}$/, "Aadhar must contain only digits")
    .optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  isDelete: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
  userId: z.string().optional(),
  salesWithCollection: z.boolean().default(false).optional(),
  orderStatusChangePermission: z.boolean().default(false).optional(),
  cashHandoverUser: z.boolean().default(false).optional(),
  returnOrderCollectedUser: z.boolean().default(false).optional(),

  // New fields
  bloodGroup: z.string().optional(),
  permanentAddress: z.string().optional(),
  presentAddress: z.string().optional(),
  emergencyContactNumber: z.string()
    .optional(),
  relationship: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  branch: z.string().optional(),
  accountNumber: z.string().optional(),
  profileImage: z.string().optional() // For storing image path
});

// ... rest of your existing schemas remain the same
export const changePasswordSchema = z.object({
  oldPin: z.string().min(4, "Old pin must be at least 4 characters long"),
  newPin: z.string().min(4, "New pin must be at least 4 characters long"),
  userId: z.string().optional(),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export const resetPasswordSchema = z.object({
  newPin: z.string().min(4, "New pin must be at least 4 characters long"),
  conformPin: z.string().min(4, "Conform pin must be at least 4 characters long"),
  userId: z.string().optional(),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export const userListQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  search: z.string().optional().default(''),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
  role: z.string().optional().default(''),
  type: z.string().optional().default(''),
});
export type UserlistSchema = z.infer<typeof userListQuerySchema>;

// Otp schemasss
export const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().min(4, "OTP must be 4 digits").max(4, "OTP must be 4 digits")
});

export const changePasswordAfterVerificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(4, "Password must be at least 4 characters")
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordAfterVerificationInput = z.infer<typeof changePasswordAfterVerificationSchema>;