import { z } from "zod";

export const couponSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(0, "Discount value must be positive"),
    type: z.enum(['all_products', 'category', 'product', 'user']),
    categoryId: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    startDate:z.string().optional(),
    endDate: z.string().optional(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
    usageLimit: z.coerce.number().min(1).optional(),
    perUserLimit: z.number().min(1).optional(),
    status: z.boolean().optional(),
});

export type CreateCouponInput = z.infer<typeof couponSchema>;

export const updateCouponSchema = couponSchema.extend({
    id: z.string().min(1, "ID is required"),
});

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

export const couponListQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    code: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    isActive: z.boolean().optional(),
});

export type CouponQueryInput = z.infer<typeof couponListQuerySchema>;