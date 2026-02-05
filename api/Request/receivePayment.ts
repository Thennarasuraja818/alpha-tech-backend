import { z } from "zod";

export const receivePaymentSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  items: z.array(z.object({
    orderId: z.string().min(1, "Order ID is required"),
    dueAmount: z.number().min(0, "Due amount must be >= 0"),
    paidAmount: z.number().min(0, "Paid amount must be > 0").optional(),
  })),
  paymentDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .transform((val) => new Date(val)).optional(),

  paymentMethod: z.enum(["Cash", "Bank Transfer", "QR Code"], {
    required_error: "Payment method is required"
  }).optional(),
  payInFull: z.boolean().default(false),
  paymentProof: z.string().optional(),
  status: z.string().optional(),
  createdBy: z.string().optional(),
});

export type ReceivePaymentInput = z.infer<typeof receivePaymentSchema>;


