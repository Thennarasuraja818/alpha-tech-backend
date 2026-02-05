import { Router } from "express";
import { IVendorpurchaseRepository } from "../../../domain/admin/purchaseDomain";
import { purchaseServiceFun } from "../../../app/service/admin/purchase.service";
import { PurchaseHandlerFun } from "../../../app/handler/admin.handler/purchase.handler";

export function RegisterPurchaseRoute(router: Router, repo: IVendorpurchaseRepository, middleware: any) {
  const svc = purchaseServiceFun(repo);
  const h = PurchaseHandlerFun(svc);

  router.post("/purchases", middleware, h.createPurchase);
  router.get("/purchases", middleware, h.getAllPurchases);
  router.get("/purchases/:id", middleware, h.getPurchaseById);
  router.put("/purchases/:id", middleware, h.updatePurchase);
  router.delete("/purchases/:id", middleware, h.deletePurchase);
  router.get("/vendor-purchases", middleware, h.getVendorPurchaseList);
  router.put("/update-payment/:id", middleware, h.updatePayment);
  router.get("/vendor/payment-dues/list", middleware, h.getVendorPaymentDues);
}