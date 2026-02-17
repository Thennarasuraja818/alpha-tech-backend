import { z } from "zod";

export const createCartSchema = z.object({
    products: z.array(
        z.object({
            productId: z.string().min(1, 'Product Id is required'),
            quantity: z.number().nonnegative('Quantity must be non-negative'),
            offerAmount: z.number().optional(),
            attributes: z.record(z.any()).optional(),
            id: z.string().optional(),
            idTolerance: z.string().optional(),
            cs: z.string().optional(),
            csTolerance: z.string().optional(),
            sku: z.string().optional(),
            variantName: z.string().optional(),
            mrpPrice: z.number().default(0).optional(),
        })
    ).optional(),
    subtotal: z.number().optional(),
    total: z.number().optional(),
    userId: z.any().optional(),
    guestUserId: z.any().optional(),
    type: z.string().nonempty(),
    offerId: z.string().optional(),
    quantity: z.number().default(0).optional(),
});

export type CreateCart = z.infer<typeof createCartSchema>;

export const ListCartSchema = z.object({

    limit: z.number().optional(),
    offset: z.number().optional(),
    search: z.string().optional(),
    sortOrder: z.string().optional(),
    order: z.string().optional(),
    type: z.string().nonempty(),
    userType: z.string().nonempty()
});

export type CartList = z.infer<typeof ListCartSchema>;