import { z } from 'zod';

export const shopTypeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export type CreateShopTypeInput = z.infer<typeof shopTypeSchema>;
export const updateShoptypeSchema = shopTypeSchema.extend({
    id: z.string().min(1, "ID is required").optional(),
});
export type UpdateShopTypeInput = z.infer<typeof updateShoptypeSchema>;


export const ShopTypeListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ShopTypeListParams = z.infer<typeof ShopTypeListQuerySchema>;
