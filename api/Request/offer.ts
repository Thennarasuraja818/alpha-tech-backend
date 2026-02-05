
import { optional, z } from "zod";

export const createMobileUserSchema = z.object({
  offerName: z.string().min(1, "Name is required"),
  discount: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  categoryId: z.string().min(1, 'CategoryId required'),
  productId: z.any(),
  id: z.string().min(1, 'Id required').optional(),
  images: z.any(),
  offerType: z.string().nonempty(),
  fixedAmount: z.string().optional(),
  mrpPrice: z.string().optional(),
  stock: z.string().optional(),
  isActive: z.preprocess(
    val => val === 'true' ? true : val === 'false' ? false : val,
    z.boolean().optional()
  )
});

export type CreateOfferInput = z.infer<typeof createMobileUserSchema>;
export type UpdateOfferInput = z.infer<
  typeof createMobileUserSchema
>;
