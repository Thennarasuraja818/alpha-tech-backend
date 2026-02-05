import { Router } from "express";
import { WholesalerHandlerFun } from "../../../app/handler/admin.handler/wholesalerandretail.handler";
import { WholesalerServiceDomain } from "../../../domain/admin/wholsalerDomain";
import { wholesalerServiceFun } from "../../../app/service/admin/wholesaler.service";
export function WholesalerAdminRoute(
    router: Router,
    adminRepo: WholesalerServiceDomain,
    middleware: any
) {
    const service = wholesalerServiceFun(adminRepo);
    const handler = WholesalerHandlerFun(service);
    // Wholesaler user routes
    router.post("/wholesaler", middleware, handler.createUser);
    router.put("/wholesaler/:id", middleware, handler.updateUser);

    router.post("/wholesaler/otp-verification", handler.otpVerification);
    router.put("/wholesaler/update/status", handler.updateStatus);
    router.post("/wholesaler/login", handler.loginUser);
    router.get("/wholesaler/list-dtls", middleware, handler.getAll);
    router.get("/wholesaler/with-inactive-list-dtls", middleware, handler.getAllWithInactive);

    router.get("/wholesaler/list-dtls/approved", middleware, handler.getAllApproved);
    router.post("/wholesaler/send-otp", handler.sendOtp);
    router.patch("/wholesaler/update/credit", middleware, handler.updateCredit);
    // router.get('/wholesaler/export-excel', middleware, handler.exportWholesalersExcel);

}
