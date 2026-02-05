import { z } from 'zod';

export const denominationSchema = z.object({
  value: z.union([z.number(), z.string()]),
  count: z.number().nullable().optional(),
  total: z.number().min(0)
});

export const createBoxCashManagementSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  closingAmount: z.number().min(0),
  denominations: z.array(denominationSchema),
  description: z.string().optional()
});

export const updateBoxCashManagementSchema = createBoxCashManagementSchema.partial();

export type CreateBoxCashManagementInput = z.infer<typeof createBoxCashManagementSchema>;
export type UpdateBoxCashManagementInput = z.infer<typeof updateBoxCashManagementSchema>;