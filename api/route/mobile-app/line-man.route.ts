import { Router } from "express";
import { ILinemanRepository } from "../../../domain/mobile-app/line-manDomain";
import { LineManService } from "../../../app/service/mobile-app/line-man.service";
import { LineManHandlerFun } from "../../../app/handler/mobile-app/line-man.handler";

export function RegisterLinemanRoute(
    router: Router,
    categoryRepo: ILinemanRepository,
    middleware: any
) {
    const service = new LineManService(categoryRepo);
    const handler = LineManHandlerFun(service);

    router.post("/lineman/visit-tracker", middleware, handler.createVisitTracker);
    router.post("/lineman/payment-receive", middleware, handler.createReceivePayment);
    router.get("/lineman/payment-receive", middleware, handler.getReceivePayment);
    router.post("/lineman/cash-settlement", middleware, handler.createCashSettlement);
    router.get("/lineman/cash-settlement", middleware, handler.getCashSettlementList);
    router.get("/lineman/users", middleware, handler.getAllUsers);
    router.get("/lineman/payment-list", middleware, handler.getPaymentList);
    router.get("/lineman/target", middleware, handler.getSalesTargetVsAchievementList);
    router.get("/lineman/sales-conversation", middleware, handler.getSalesConversionReport);
    router.get("/lineman/customer-activity", middleware, handler.getCustomerActivity);
    router.get("/lineman/order-summary", middleware, handler.getOrderSummary);
    router.get("/lineman/inactive-customer", middleware, handler.inactiveCustomer);
    router.get("/lineman/visit-tracker", middleware, handler.getVisitTrackerReport);
    router.get('/line-man/outstanding-payments', middleware, handler.getOutstandingPayments);
    router.get('/line-man/performance', middleware, handler.getSalesPerformanceByUser);
    router.get('/line-man/duelist', middleware, handler.getPaymentDueList);
    router.get('/line-man/salestarget', middleware, handler.getSalesTargetAchievement);
    router.get('/line-man/shop-type', middleware, handler.getAllShopType);

}
