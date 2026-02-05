import { z } from "zod";

export const CreateReviewSchema = z.object({

    productId: z.string().nonempty(),
    userId: z.string().nonempty(),
    rating: z.number().nonnegative(),
    comment: z.string().optional(),
    images:  z.any(),
    orderId: z.string().nonempty(),

});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
