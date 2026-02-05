import { z } from 'zod';

export const BannerSchema = z.object({
    images: z.any(),
    name: z.string().optional().default(''),
    id: z.string().optional(),
    imageIds: z.string().optional(),
});

export type CreateBannerInput = z.infer<typeof BannerSchema>;
export type UpdateBannerInput = z.infer<typeof BannerSchema>;


export const BannerListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
    type: z.string().optional().default(''),
});

export type BannerListParams = z.infer<typeof BannerListQuerySchema>;
