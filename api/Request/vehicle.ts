import { z } from 'zod';

export const VehicleSchema = z.object({
    id: z.string().optional(),
    vehicleNumber: z.string().min(1, "Vehicle number is required"),
    fcDate: z.string().optional().nullable(),
    insuranceDate: z.string().optional().nullable(),
    taxDate: z.string().optional().nullable(),
    permitDate: z.string().optional().nullable(),
    advertiseDate: z.string().optional().nullable(),
    pollutionDate: z.string().optional().nullable(),
    status: z.enum(['active', 'inactive', 'expired']).optional().default('active'),
    isDelete: z.boolean().optional().default(false)
});

export type CreateVehicleInput = z.infer<typeof VehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof VehicleSchema>;

export const VehicleListQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
    search: z.string().optional().default(''),
    sort: z.enum(['asc', 'desc']).optional().default('asc'),
    status: z.enum(['active', 'inactive', 'expired']).optional()
});

export type VehicleListParams = z.infer<typeof VehicleListQuerySchema>;
