import { z } from "zod";

export const createChildCategorySchema = z.object({
  subcategory: z.string().min(1),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1),
    // .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
  description: z.string().optional(),
  images: z.any().optional(),
  featuredCategory: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === "true" || val === true)
    .optional(),
  metaKeywords: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  displayOrder: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? Number(val) : val))
    .optional(),
  status: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === "true" || val === true)
    .optional(),
  tags: z.string().optional(),
});

export const updateChildCategorySchema = createChildCategorySchema.partial();

export type CreateChildCategoryInput = z.infer<
  typeof createChildCategorySchema
>;
export type UpdateChildCategoryInput = z.infer<
  typeof updateChildCategorySchema
>;
