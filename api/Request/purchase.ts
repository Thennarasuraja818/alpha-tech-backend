import { z } from "zod";

export const createPurchaseSchema = z.object({
  vendorId: z.string().min(1).optional(),
  notVendor: z.string().min(1).optional(),
  products: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive(),
    buyingPrice: z.number().positive(),
    sellingPrice: z.number().default(0),
    quantityReceived: z.number().default(0),
    isProductReceived: z.boolean().default(false),
    attributes: z.any(),
    expiryDate: z.string().optional()
  })),

  totalPrice: z.number().positive(),
  status: z.enum(["pending", "completed", 'partially completed', "cancelled"]).optional().default("pending"),
  orderId: z.string().optional(),
  invoiceId: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
});

export const updatePurchaseSchema = z.object({
  vendorId: z.string().min(1).nullable().optional().transform(val => val === '' ? null : val),
  notVendorId: z.string().min(1).optional(),
  products: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive(),
    buyingPrice: z.number().positive(),
    sellingPrice: z.number().default(0),
    quantityReceived: z.number().default(0),
    isProductReceived: z.boolean().default(false),
    attributes: z.any(),
    expiryDate: z.string().optional()

  })).optional(),
  totalPrice: z.number().positive().optional(),
  status: z.enum(["pending", "completed", 'partially completed', "cancelled"]).optional(),
  orderId: z.string().optional(),
  modifiedBy: z.string().optional(),
}).partial();

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;