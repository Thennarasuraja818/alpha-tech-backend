
import { z } from "zod";

export const createDeliverymanReqSchema = z.object({
    type: z.string().nonempty(),
    notes: z.string().optional()
});

export type CreateDeliveryReqInput = z.infer<typeof createDeliverymanReqSchema>;
export type UpdateDeliveryReqInput = z.infer<
    typeof createDeliverymanReqSchema
>;
