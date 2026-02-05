// api/Request/boxCash.ts
import { z } from 'zod';

export const createBoxCashSchema = z.object({
  transactionType: z.enum(['pettycash', 'purchase', 'expense', 'withdraw', 'deposit', 'collection']),
  date: z.string().transform(str => new Date(str)),
  userType: z.enum(['employee', 'notEmployee']).optional(),
  employeeId: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.includes(',')) return val.split(',');
    return val ? [val] : [];
  }),
  receiver: z.string().optional(),
  amount: z.number().min(0),
  description: z.string().optional(),
  expenseType: z.string().optional(), // Add expense type field
}).refine((data) => {
  if (data.transactionType !== 'pettycash' && data.transactionType !== 'withdraw' && data.transactionType !== 'deposit') {
    return !!data.userType;
  }
  return true;
}, {
  message: "User type is required for non-pettycash transactions",
  path: ["userType"]
}).refine((data) => {
  if (data.transactionType !== 'pettycash' && data.userType === 'employee') {
    return data.employeeId && data.employeeId.length > 0;
  }
  return true;
}, {
  message: "Employee is required when user type is employee",
  path: ["employeeId"]
}).refine((data) => {
  if (data.transactionType !== 'pettycash' && data.userType === 'notEmployee') {
    return !!data.receiver;
  }
  return true;
}, {
  message: "Receiver is required when user type is not employee",
  path: ["receiver"]
}).refine((data) => {
  if (data.transactionType === 'purchase') {
    return !!data.description;
  }
  return true;
}, {
  message: "Description is required for purchase transactions",
  path: ["description"]
}).refine((data) => {
  if (data.transactionType === 'expense') {
    return !!data.expenseType;
  }
  return true;
}, {
  message: "Expense type is required for expense transactions",
  path: ["expenseType"]
});

export type CreateBoxCashInput = z.infer<typeof createBoxCashSchema>;
export type UpdateBoxCashInput = Partial<CreateBoxCashInput>;