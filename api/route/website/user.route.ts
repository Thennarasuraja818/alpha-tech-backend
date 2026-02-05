import { Router } from "express";
// import { IAdminRepository } from "../../../domain/admin/adminDomain";
// import { adminServiceFun } from "../../../app/service/admin.service";
// import { AdminUserHandlerFun } from "../../../app/handler/admin.handler/admin.handler";

import { IWebsiteUserRepository } from "../../../domain/website/user.domain";
import { UserHandlerFun } from "../../../app/handler/website.handler/user.handler";
import { webSiteUserServiceFun } from "../../../app/service/website/user.service";
export function RegisterWebSiteUserRoute(
  router: Router,
  adminRepo: IWebsiteUserRepository,
  middleware: any
) {
  const service = webSiteUserServiceFun(adminRepo); // Pass repository to service
  const handler = UserHandlerFun(service); // Pass service to handler
  router.post("/user", handler.createUser); // Define route
  router.post("/login", handler.loginUser); // Define route
  // // Password management routes
  // router.post("/admin-forgot-password", handler.forgotPassword);
  // router.post("/admin-reset-password", handler.resetPassword);
  // router.post("/admin-change-password", middleware, handler.changePassword);
}
