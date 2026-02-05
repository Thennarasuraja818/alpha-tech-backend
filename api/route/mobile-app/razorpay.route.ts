import { Router } from "express";
import { IRazorpayRepository } from "../../../domain/mobile-app/razorpayDomain";
import { RazorpayHandlerFun } from "../../../app/handler/mobile-app/razorpay.handler";
// import { IRazorpayRepository } from "../../../domain/mobile-app/razorpayDomain";
// import { RazorpayService } from "../../../app/service/mobile-app/razorpay.service";
// import { RazorpayHandlerFun } from "../../../app/handler/mobile-app/razorpay.handler";
import { RazorpayService } from "../../../app/service/mobile-app/razorpay.service";

export function RegisterRazorpayRoute(
    router: Router,
    categoryRepo: IRazorpayRepository,
    middleware: any
) {
    const service = new RazorpayService(categoryRepo);
    const handler = RazorpayHandlerFun(service);

    router.post("/razorpay/generate-qr", middleware, handler.generateQRforPayment);
    router.get("/user-wallet/:id", handler.getUserWallet);
    router.get("/user-wallet/transaction/history/:id", handler.getWalletHistory);
    router.post("/handleJuspayResponse", handler.handleJuspayResponse);

}
