import { z } from "zod";

export const returnPickedupSettlementSchema = z.object({
    pickedUpIds: z.string().nonempty(),
    handoverTo: z.string().min(1, "HandoverTo (User ID) is required").optional(),
    date: z.any(),
    notes: z.string().optional(),
});

export type ReturnSettlementInput = z.infer<typeof returnPickedupSettlementSchema>;
