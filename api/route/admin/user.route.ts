import { Router } from "express";
import { UserHandlerFun } from "../../../app/handler/admin.handler/user.handler";
import { userServiceFun } from "../../../app/service/admin/user.service";
import { IUserCreateRepository } from "../../../domain/admin/userDomain";

export function RegisterUserRoute(router: Router, userRepo: IUserCreateRepository, middleware: any) {
  const service = userServiceFun(userRepo);
  const handler = UserHandlerFun(service);

  router.post("/users", handler.createUser);
  router.get("/users", handler.getAllActiveUsers);
  router.get("/users/inactive", handler.getAllInactiveUsers);
  router.get("/users/all", handler.getAllUsers);
  router.get("/users/:id", handler.getUserById);
  router.put("/users/:id", middleware, handler.updateUser);
  router.put("/users/reset-password", middleware, handler.resetPassword);
  router.delete("/users/:id", middleware, handler.deleteUser);
  router.get("/users-logs", middleware, handler.getUserLogsList);
  router.get("/customers", middleware, handler.getAllCustomer);

  // lineman and crm fetch
    router.get("/linemanCrmUsers", handler.getUserSearch);


}
