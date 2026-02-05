// src/api/Request/VehicleComplaintReq.ts
import { z } from "zod";

export const createVehicleComplaintSchema = z.object({
    userId: z.string().min(1, 'userId required').optional(),
    comment: z.string().min(1, 'Comment is required'),
    proof: z.any().optional(),
    status: z.enum(['pending', 'resolved', 'in-progress']).default('pending'),
    type: z.string().nonempty()
});
export const updateDeliveryStatusSchema = z.object({
    status: z.string().nonempty(),
    otp: z.number().optional(),
});

export const updateComplaintentStatus = z.object({
    status: z.string().nonempty(),
});
export type UpdateComplaintStatus = z.infer<typeof updateComplaintentStatus>;
export const updateRequestStatus = z.object({
    status: z.string().nonempty(),
});
export type UpdateRequestStatus = z.infer<typeof updateRequestStatus>;

export type UpdateDeiveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type CreateVehicleComplaintInput = z.infer<typeof createVehicleComplaintSchema>;
export type UpdateVehicleComplaintInput = z.infer<typeof createVehicleComplaintSchema>;