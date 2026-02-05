import { Router } from "express";
import { UserRoleHandlerFun } from "../../../app/handler/admin.handler/userRole.hander";
import { UserRoleServiceFun } from "../../../app/service/admin/userRole.service";
import { IUserRoleCreateRepository } from "../../../domain/admin/userRoleDomain";

export function RegisterUserRoleRoute(router: Router, userRoleRepo: IUserRoleCreateRepository, middleware: any) {
  const service = UserRoleServiceFun(userRoleRepo);
  const handler = UserRoleHandlerFun(service);

  router.post("/user-role", handler.createUserRole);
  router.get("/user-role", handler.getAllUserRole);
  router.get("/user-role/:id", handler.getUserRoleById);

  router.put("/user-role/:id", middleware, handler.updateUserRole);
  router.delete("/user-role/:id", middleware, handler.deleteUserRole);
}
