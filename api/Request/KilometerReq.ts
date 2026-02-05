
import { z } from "zod";

export const createKilometerSchema = z.object({
    beforeImg: z.any().optional(),
    afterImg: z.any().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    date: z.any()

});

export type CreateKilometerInput = z.infer<typeof createKilometerSchema>;
export type UpdateKilometerInput = z.infer<
    typeof createKilometerSchema
>;
