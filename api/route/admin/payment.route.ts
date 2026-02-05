import { Router } from "express";
import { IPaymentRepository } from "../../../domain/admin/paymentDomain";
import { paymentServiceFun } from "../../../app/service/admin/payment.service";
import { PaymentHandlerFun } from "../../../app/handler/admin.handler/payment.hander";


export function PaymentRoute(
  router: Router,
  wholeSaleOrderRepo: IPaymentRepository,
  middleware: any
) {
  const service = paymentServiceFun(wholeSaleOrderRepo);
  const handler = PaymentHandlerFun(service);

   router.get("/payment/order-list", middleware, handler.list);
   router.get("/payment/unpaid-order-list", middleware, handler.unpaidlist);
   router.get("/payment/daily-payment-list", middleware, handler.dailypaymentlist);
}
