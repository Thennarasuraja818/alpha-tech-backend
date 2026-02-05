import { z } from 'zod';

export const createSalesTargetSchema = z.object({
  salemanId: z.string().min(1, 'Salesman ID is required'),
  targetSalesAmount: z.number().positive('Target sales amount must be positive'),
  targetPeriod: z.enum(['Monthly', 'Quarterly', 'Yearly']),
  incentiveAmount: z.number().min(0).optional().default(0),
  status: z.enum(['Achieved', 'Not Achieved', 'Exceeded']).optional().default('Not Achieved'),
});

export const updateSalesTargetSchema = z.object({
  salemanId: z.string().min(1, 'Salesman ID is required').optional(),
  targetSalesAmount: z.number().positive('Target sales amount must be positive').optional(),
  targetPeriod: z.enum(['Monthly', 'Quarterly', 'Yearly']).optional(),
  incentiveAmount: z.number().min(0).optional(),
  status: z.enum(['Achieved', 'Not Achieved', 'Exceeded']).optional(),
  isActive: z.boolean().optional(),
});

export const updateCashsettlmentStatusSchema = z.object({
  status: z.string().nonempty(),
});

export type CreateSalesTargetInput = z.infer<typeof createSalesTargetSchema>;
export type UpdateSalesTargetInput = z.infer<typeof updateSalesTargetSchema>;
export type UpdateCashsettlementtInput = z.infer<typeof updateCashsettlmentStatusSchema>;
