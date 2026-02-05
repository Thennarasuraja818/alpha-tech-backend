import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1),
    // .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
  description: z.string().optional(),
  tags: z.string().optional(),
  images: z.any(),
  featuredCategory: z
    .union([z.boolean(), z.string()])
    .transform(val => val === 'true' || val === true)
    .optional(),
  metaKeywords: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  displayOrder: z
    .union([z.number(), z.string()])
    .transform(val => typeof val === 'string' ? Number(val) : val)
    .optional(),
  status: z
    .union([z.boolean(), z.string()])
    .transform(val => val === 'true' || val === true)
    .optional(),
 
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
