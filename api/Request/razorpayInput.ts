
import { z } from "zod";

export const createRazorpaySchema = z.object({
    amount: z.number().nonnegative(),
    paymentMethod: z.string().nonempty(),
    customerId:z.string().optional(),
    razorpayOrderId: z.string().optional()
});

export type CreateRazorpayInput = z.infer<typeof createRazorpaySchema>;
export const getRazorpaySchema = z.object({
  
    razorpayOrderId: z.string().nonempty()
});

export type GetRazorpayInput = z.infer<typeof getRazorpaySchema>;
