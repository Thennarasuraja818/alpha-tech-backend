import { z } from "zod";
export const createPettyCashManagementSchema = z.object({

  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),

  initialAmount: z.union([
    z.number().nonnegative(),
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) throw new Error("Initial amount must be a valid number");
      return parsed;
    })
  ]),

  giver: z.string().optional(),
});

// Denomination item schema
const denominationSchema = z.object({
  value: z.union([
    z.number().positive(),
    z.string()
  ]),
  count: z.union([
    z.number().int().nonnegative().nullable(),
    z.string().transform(val => val === '' ? null : parseInt(val)).pipe(z.number().int().nonnegative().nullable())
  ]).optional().nullable(),
  total: z.union([
    z.number().nonnegative(),
    z.string().transform(val => parseFloat(val)).pipe(z.number().nonnegative())
  ])
});

export const updatePettyCashManagementSchema = z.object({
  closingAmount: z.union([
    z.number().nonnegative(),
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) throw new Error("Closing Amount must be a valid number");
      return parsed;
    })
  ]).optional(),
  receiver: z.string().optional(),
  handover: z.string().optional(),
  differenceType: z.enum(['excess', 'shortage', 'balanced']).optional(),
  differenceAmount: z.number().nonnegative().optional(),
  denominations: z.array(denominationSchema).optional(),
  isAdmin: z.boolean().optional(),

});

export type CreatePettyCashManagementInput = z.infer<typeof createPettyCashManagementSchema>;
export type UpdatePettyCashManagementInput = z.infer<typeof updatePettyCashManagementSchema>;
