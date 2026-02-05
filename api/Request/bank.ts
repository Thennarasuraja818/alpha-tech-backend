import { z } from 'zod';

export const BankSchema = z.object({
    id: z.string().optional(),
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string()
        .min(9, "Account number must be at least 9 digits")
        .max(18, "Account number cannot exceed 18 digits")
        .regex(/^\d+$/, "Account number must contain only numbers"),
    ifscCode: z.string()
        .min(11, "IFSC code must be 11 characters")
        .max(11, "IFSC code must be 11 characters")
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    accountType: z.enum(['SAVING', 'CURRENT'], {
        errorMap: () => ({ message: "Account type must be SAVING or CURRENT" })
    }),
    branch: z.string().min(1, "Branch name is required"),
    status: z.enum(['active', 'inactive']).optional().default('active'),
    isDelete: z.boolean().optional().default(false)
});

export type CreateBankInput = z.infer<typeof BankSchema>;
export type UpdateBankInput = z.infer<typeof BankSchema>;

export const BankListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
    status: z.enum(['active', 'inactive']).optional()
});

export type BankListParams = z.infer<typeof BankListQuerySchema>;