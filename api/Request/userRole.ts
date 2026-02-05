import { z } from "zod";

export const createUserRoleSchema = z.object({
  roleName:z.string().optional(),
  rolePermissions: z.array(
    z.object({
     
      feature: z.string().optional(),
      view: z.boolean().optional(),
      add: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
    })
  ),
   isDelete: z.boolean().default(false).optional(),
  createdBy: z.any().optional(),
  modifiedBy: z.any().optional(),
});

export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;
