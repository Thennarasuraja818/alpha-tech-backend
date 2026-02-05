import { Router } from "express";
import { IUserCreateRepository } from "../../../domain/admin/userDomain";
import { userServiceFun } from "../../../app/service/admin/user.service";
import { UserHandlerFun } from "../../../app/handler/admin.handler/user.handler";
export function RegisterAdminUsersRoute(
  router: Router,
  adminRepo: IUserCreateRepository,
  middleware: any
) {
  const service = userServiceFun(adminRepo);
  const handler = UserHandlerFun(service);
  router.post("/adminuser-login", handler.loginUser); // Define route
  router.get("/get/pincode", middleware, handler.getPincodes);

}
