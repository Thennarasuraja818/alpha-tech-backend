import { z } from "zod";

export const customervaraintSchema = z.object({
  name: z.string().nonempty()
})
export type CreateCustomerVariant = z.infer<typeof customervaraintSchema>;

export const updatevaraintSchema = customervaraintSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type UpdateCustomerVariant = z.infer<typeof updatevaraintSchema>;

export const customervaraintRetailerSchema = z.object({
  variantId: z.string().nonempty(),
  id: z.string().nonempty(),
  userType: z.string().nonempty()
})
export type UpdateCustomerVariantRetailer = z.infer<typeof customervaraintRetailerSchema>;
