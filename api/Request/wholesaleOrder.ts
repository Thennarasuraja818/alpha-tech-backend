import { z } from "zod";

export const createWholesaleOrderSchema = z.object({
  customerName: z.string().min(1),
  customerContact: z.string().min(1),
  customerDeliveryAddress: z.string().min(1),
  customerOrderNotes: z.string().optional(),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  discountApplied: z.number().min(0).optional(),
  totalPrice: z.number().min(0),
  stockLocation: z.string().min(1),
  paymentMode: z.string().min(1),
  paymentStatus: z.string().min(1),
  deliveryType: z.string().min(1),
  deliveryPerson: z.string().optional(),
  estimatedDeliveryDate: z.string().optional().refine(val => !val || Boolean(Date.parse(val)), { message: "Invalid date" }),
  actualDeliveryDate: z.string().optional().refine(val => !val || Boolean(Date.parse(val)), { message: "Invalid date" }),
  deliveryStatus: z.string().min(1),
  deliveryOrderNotes: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  orderId: z.string().optional(),
});

export const updateWholesaleOrderSchema = createWholesaleOrderSchema.partial();

export type CreateWholesaleOrderInput = z.infer<typeof createWholesaleOrderSchema>;
export type UpdateWholesaleOrderInput = z.infer<typeof updateWholesaleOrderSchema>;
