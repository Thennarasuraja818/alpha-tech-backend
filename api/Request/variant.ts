import { z } from 'zod';

export const variantSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export type CreateVariantInput = z.infer<typeof variantSchema>;

export type UpdateVariantInput = {
    id: string;
    name: string;
};

export const variantListQuerySchema = z.object({
    page: z.string().optional().transform(val => {
        const p = val ? parseInt(val, 10) : 1;
        return p > 0 ? p : 1;
    }),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
    type: z.string().optional().default(''),
});

export type VariantListParams = z.infer<typeof variantListQuerySchema>;
