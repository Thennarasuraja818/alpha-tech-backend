import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().optional(),
  paymentDueDays: z.string().min(1, "Credit card limit is required"),
  address: z.string().min(1, "Address is required"),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  gstNumber: z.string().optional(),
  city: z.string().optional(),
  alternativeNumber: z.string().optional(),

  products: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      value: z.string()
    })
  ).optional()
});

export type CreateVendorInput = z.infer<typeof vendorSchema>;

export type UpdateVendorInput = {
  id: string;
} & CreateVendorInput;

export const vendorListQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  search: z.string().optional().default(''),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
  type: z.string().optional().default(''),
  vendorId: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  format:z.string().optional()
});

export type VendorListParams = z.infer<typeof vendorListQuerySchema>;
export const vendorPaymentQuerySchema = z.object({

  paymentMode: z.string().nonempty(),
  amount: z.number().default(0),
  modifiedBy: z.string().optional(),
  referenceNo: z.string().optional()
});

export type VendorPayments = z.infer<typeof vendorPaymentQuerySchema>;
