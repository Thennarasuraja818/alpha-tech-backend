import { z } from 'zod';

export const TaxSchema = z.object({
    taxName: z.string().optional().default(''),
    taxType: z.enum(['GST', 'VAT', 'Service Tax', 'Other','Percentage','Fixed Amount']).optional().default('GST'),
    taxRate: z.number().optional().default(0),
    id: z.string().optional(),
    isActive: z.boolean().optional().default(true)
});

export type CreateTaxInput = z.infer<typeof TaxSchema>;
export type UpdateTaxInput = z.infer<typeof TaxSchema>;

export const TaxListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
    taxType: z.enum(['GST', 'VAT', 'Service Tax', 'Other']).optional()
});

export type TaxListParams = z.infer<typeof TaxListQuerySchema>;