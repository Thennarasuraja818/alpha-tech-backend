import { z } from 'zod';

export const attributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
});

export type CreateAttributeInput = z.infer<typeof attributeSchema>;

export type UpdateAttributeInput = {
  id: string;
  name: string;
  value: string;
};

export const attributeListQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional().default(''),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
  type: z.string().optional().default(''),
});

export type AttributeListParams = z.infer<typeof attributeListQuerySchema>;
