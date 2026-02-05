import { Router } from "express";
import { IWholesaleOrderRepository } from "../../../domain/admin/wholesaleOrderDomain";
import { WholesaleOrderHandlerFun } from "../../../app/handler/admin.handler/wholesale.order.handler";
import { wholesaleOrderServiceFun } from "../../../app/service/admin/wholesaleOrder.service";

export function WholeSaleOrderRoute(
  router: Router,
  wholeSaleOrderRepo: IWholesaleOrderRepository,
  middleware: any
) {
  const service = wholesaleOrderServiceFun(wholeSaleOrderRepo);
  const handler = WholesaleOrderHandlerFun(service);

  router.post("/wholeSaleOrder", middleware, handler.createWholeSaleOrder);
  router.get("/wholeSaleOrder", middleware, handler.getAllWholeSaleOrder);
  router.get("/order-list", middleware, handler.list);
  router.get("/delivery-list", middleware, handler.deliveryList);
  router.get("/deliveryman-performance-list", middleware, handler.deliverymanPerformanceList);
  router.get("/deliveryman-top-performance-list", middleware, handler.deliverymanTopPerformanceList);
  router.get("/failed-delivery-list", middleware, handler.failedDeliveryList);
  router.patch("/order/status/:id/:status", middleware, handler.updateStatus);
  router.patch("/order/payment/:id", middleware, handler.updateOrderPayment);
  router.get("/wholesaler/order/paymentstatus", middleware, handler.findOrderOfWholesaler);
  router.get("/return-orders", middleware, handler.returnOrderList);
  router.patch("/return-order/status/:id", middleware, handler.updateReturnOrderStatus);
  router.get("/wholesaler/order/credit-dtls", middleware, handler.findCreditDetails);
  router.get("/wholesaler/order/credit", middleware, handler.findCreditOrderDetails);

  router.get("/order/:id", handler.orderDetails);
  router.get("/get-details-by-invoiceId/:invoiceId", handler.orderDetailsByInvoiceId);

  router.get("/wholesaler/paymentDue", middleware, handler.findCreditOrderDetailsForPaymentDue);
  router.get("/top-wholesaler-orders", middleware, handler.topWholesalerOrder);
  router.patch(
    "/order/status/approve/:id/:status",
    middleware,
    handler.approvedUpdateStatus
  );
  router.patch(
    "/order/status/approve/:id/:status/:reason",
    middleware,
    handler.approvedUpdateStatus
  );
}
