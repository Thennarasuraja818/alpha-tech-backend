import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateBrandInput = z.infer<typeof brandSchema>;

export const updateBrandSchema = brandSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

export const brandListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),search: z.string().optional().default(''),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
  type: z.string().optional().default(''),

});

export type BrandListQuery = z.infer<typeof brandListQuerySchema>;