import { z } from 'zod';

export const expenseTypeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export type CreateExpenseTypeInput = z.infer<typeof expenseTypeSchema>;

export const updateExpensetypeSchema = expenseTypeSchema.extend({
    id: z.string().min(1, "ID is required").optional(),
});

export type UpdateExpenseTypeInput = z.infer<typeof updateExpensetypeSchema>;

export const ExpenseTypeListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ExpenseTypeListParams = z.infer<typeof ExpenseTypeListQuerySchema>;