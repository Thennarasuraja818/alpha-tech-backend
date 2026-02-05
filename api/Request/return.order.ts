import { z } from 'zod';

export const createOrderSchema = z.object({
    placedBy: z.string().optional(),
    placedByModel: z.enum(['Admin', 'AdminUser', 'Wholesaler', 'User', 'Retailer']),
    items: z
        .array(
            z.object({
                productId: z.string().nullable().optional().default(null),
                quantity: z.number().int().positive(),
                unitPrice: z.number().nonnegative(),
                attributes: z.record(z.any()).optional(),
                offerId: z.string().nullable().optional().default(null),
                offerType: z.string().optional(),
            })
        )
        .min(1, 'At least one item is required'),
    shippingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        contactName: z.string().optional(),
        contactNumber: z.string().optional(),
    }),
    totalAmount: z.number().nonnegative(),
    paymentMode: z.string().nonempty(),
    orderType: z.string().optional(),
    paidAmount: z.number().nonnegative().optional(),
    paymentType: z.string().optional(),
    orderId: z.string().nonempty(),
    subTotal: z.number().default(0),
    totalTaxValue: z.number().default(0),
    returnOrderFrom: z.string().optional(),
    isExchangeFlag: z.boolean().default(false)

});
export type CreateReturnOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
    status: z
        .enum(['pending', 'shipped', 'delivered', 'cancelled'])
        .optional(),
    paymentStatus: z.enum([
        'Pending',
        'Refund Initiated',
        'Refund Completed',
        'Failed'
    ]).optional(),

    shippingAddress: z
        .object({
            street: z.string().nonempty(),
            city: z.string().nonempty(),
            state: z.string().nonempty(),
            postalCode: z.string().nonempty(),
            country: z.string().nonempty(),
            contactName: z.string().nonempty(),
            contactNumber: z.string().nonempty(),
        })
        .optional(),
    totalAmount: z.number().nonnegative(),
    placedByModel: z.enum(['Admin', 'AdminUser', 'Wholesaler', 'User', 'Retailer']),
    paymentMode: z.string().nonempty(),
    orderType: z.string().optional(),
    orderId: z.string().nonempty(),
    subTotal: z.number().default(0),
    totalTaxValue: z.number().default(0),
    isExchangeFlag: z.boolean().default(false),
    returnOrderFrom: z.string().optional(),

});
export type UpdateReturnOrderInput = z.infer<typeof updateOrderSchema>;
export const updateOrderStatusSchema = z.object({
    orderId: z.string().nonempty(),
    status: z
        .enum(['pending', 'shipped', 'delivered', 'cancelled'])
        .optional(),
    userId: z.string()
});
export type UpdateReturnOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;