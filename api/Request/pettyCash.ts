import { z } from "zod";

export const createPettyCashSchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  amount: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) throw new Error('Amount must be a valid number');
      return parsed;
    })
  ]).transform(val => Number(val)),
  receiver: z.string().optional(),
  employeeId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  paymentMode: z.enum(["cash", "upi", "bank_transfer", "cheque"]),
  transactionType: z.enum(["deposit", "withdrawal", "expense","purchase"]),
  referenceNumber: z.string().optional(),
  documents: z.any().optional(),
});

export const updatePettyCashSchema = createPettyCashSchema.partial().extend({
  date: z.string().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  amount: z.number().positive().optional(),
});

export type CreatePettyCashInput = z.infer<typeof createPettyCashSchema>;
export type UpdatePettyCashInput = z.infer<typeof updatePettyCashSchema>;
