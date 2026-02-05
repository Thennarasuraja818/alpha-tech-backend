import { Router } from "express";
import { IAdminRepository } from "../../../domain/admin/adminDomain";
import { adminServiceFun } from "../../../app/service/admin/admin.service";
import { AdminUserHandlerFun } from "../../../app/handler/admin.handler/admin.handler";
export function RegisterAdminRoute(
  router: Router,
  adminRepo: IAdminRepository,
  middleware: any
) {
  const service = adminServiceFun(adminRepo); // Pass repository to service
  const handler = AdminUserHandlerFun(service); // Pass service to handler
  router.post("/admin-user", handler.createAdminUser); // Define route
  router.post("/admin-login", handler.loginAdminUser); // Define route
  router.get("/admin-user/:id", handler.getAdminProfile);
  // Password management routes
  router.post("/admin-forgot-password", handler.forgotPassword);
  router.post("/admin-reset-password", handler.resetPassword);
  router.post("/admin-change-password", middleware, handler.changePassword);
  router.post("/admin-check-mobile", handler.checkMobileNumber);
  router.post("/admin-change-password-by-id", handler.changePasswordByUserId);
}
