import { Router } from "express";
import { WholesalerHandlerFun } from "../../../app/handler/mobile-app/wholesalerandretail.handler";
import { wholesalerServiceFun } from "../../../app/service/mobile-app/wholesaler.service";
import { WholesalerServiceDomain } from "../../../domain/mobile-app/wholsalerDomain";
export function WholesalerUserRoute(
    router: Router,
    adminRepo: WholesalerServiceDomain,
    middleware: any
) {
    const service = wholesalerServiceFun(adminRepo);
    const handler = WholesalerHandlerFun(service);
    // Wholesaler user routes
    router.post("/wholesaler", middleware, handler.createUser);
    router.patch("/wholesaler/:id", middleware, handler.updateUser);
    router.post("/wholesaler/otp-verification", handler.otpVerification);
    router.get("/wholesaler/list", middleware, handler.getAll);
    router.post("/wholesaler/send-otp", handler.sendOtp);
    router.post("/wholesaler/login", handler.loginUser);
    router.post("/wholesaler/change-password", handler.changePassword);

}
