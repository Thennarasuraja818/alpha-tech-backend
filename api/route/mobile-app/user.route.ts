import { Router } from "express";
import { IMobileUserRepository } from "../../../domain/mobile-app/user.domain";
import { mobileUserServiceFun } from "../../../app/service/mobile-app/user.service";
import { UserHandlerFun } from "../../../app/handler/mobile-app/user.handler";
export function RegisterMobileUserRoute(
  router: Router,
  adminRepo: IMobileUserRepository,
  middleware: any
) {
  const service = mobileUserServiceFun(adminRepo); // Pass repository to service  
  const handler = UserHandlerFun(service); // Pass service to handler
  router.post("/user", handler.createUser); // Define route
  router.put("/otp-verification", handler.otpVerification); // Define route
  router.put("/update-pin", handler.addPin); // Define route
  router.post("/login", handler.loginUser); // Define route
  router.post("/change-password", handler.changePassword);
  router.put("/update-user/:id", handler.updateUser);
  router.get('/user/:id',handler.userData)
}
