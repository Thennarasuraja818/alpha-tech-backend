import { z } from "zod";

export const receiveCashSettlementSchema = z.object({
    cashToBeSettled: z.number().min(1, "Cash to be settled is required"),
    settlementMode: z.enum(["Handover", "Bank", "UPI"], {
        errorMap: () => ({ message: "Invalid settlement mode" }),
    }),
    handoverTo: z.string().min(1, "HandoverTo (User ID) is required").optional(),
    settledBy: z.string().optional(),
    settlementDate: z.coerce.date({ required_error: "Settlement date is required" }),
    notes: z.string().optional(),
});

export type ReceiveCashSettlementInput = z.infer<typeof receiveCashSettlementSchema>;
