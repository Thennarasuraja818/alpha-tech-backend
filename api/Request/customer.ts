import { z } from "zod";

export const createCustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string().min(1, "Phone Number is required"),
    address: z.string().optional(),
    pincode: z.string().optional(),
    createdBy: z.string().optional(),
    modifiedBy: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
