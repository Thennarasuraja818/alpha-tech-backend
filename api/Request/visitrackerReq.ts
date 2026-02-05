import { z } from "zod";

export const createVisitSchema = z.object({
    wholeSalerId: z.string().min(1, "wholesaler Id required"),
    visitPurpose: z.string().min(1, "Visit Purpose required"),
    userId: z.string().optional(),
    followUpDate: z.coerce.date().optional(),
    visitNotes: z.string().optional(),
    status: z.string().min(1, 'Status required'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
});

export type CreateVisitTracker = z.infer<typeof createVisitSchema>;