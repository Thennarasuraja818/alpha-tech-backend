
import { z } from "zod";

export const createReturnPickedUpSchema = z.object({
    orderId: z.string().nonempty(),
    status: z.string().nonempty()

});

export type CreateReturnPickedUpInput = z.infer<typeof createReturnPickedUpSchema>;
export type UpdateReturnPickedUpInput = z.infer<
    typeof createReturnPickedUpSchema
>;
