import { z } from "zod";

export const rootSchema = z.object({
  rootName: z.string().nonempty("Root name is required"),
  pincode: z.array(z.string()).nonempty("Pincode is required"),
  salesman: z.string().nonempty("Salesman is required"),
  crmUser: z.string().nonempty("CRM User is required"),
  deliveryCharge: z.number().min(0, "Delivery charge must be a non-negative number"),
  deliveryman: z.string().nonempty("Deliveryman is required"),
  variants: z.array(z.object({
    from: z.number(),
    to: z.number(),
    quantity: z.number().default(1),
    price: z.number().default(0)
  }))
})
export type CreateRootInput = z.infer<typeof rootSchema>;

export const updateRootSchema = rootSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type UpdateRootInput = z.infer<typeof updateRootSchema>;

export const rootListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional().default(''),
  pincode: z.string().optional(),
});

export type RootQueryInput = z.infer<typeof updateRootSchema>;
