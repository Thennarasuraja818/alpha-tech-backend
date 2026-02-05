import { z } from "zod";


export const createUserAddressSchema = z.object({

    userId: z.string().nonempty(),
    //   label: { type: String, enum: ['HOME', 'WORK', 'OTHER'], required: true },
    label: z.enum(['HOME', 'WORK', 'OTHER']).optional(),
    addressLine: z.string().nonempty(),
    city: z.string().nonempty(),
    state: z.string().nonempty(),
    postalCode: z.string().nonempty(),
    country: z.string().nonempty(),
    contactName: z.string().nonempty(),
    contactNumber: z.string().nonempty(),
});

export type CreateUserAddress = z.infer<typeof createUserAddressSchema>;
