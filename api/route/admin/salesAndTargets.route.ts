import { Router } from "express";
import { NewSalesTargetHandler } from "../../../app/handler/admin.handler/salesAndTargets.handler";
import { SalesTargetService } from "../../../app/service/admin/salesAndTargets.service";
import { SalesTargetDomainRepository } from "../../../domain/admin/salesAndTargetsDomain";
export function RegisterSalesAndTargetsRoute(router: Router, repo: SalesTargetDomainRepository, middleware: any) {
  const svc = new SalesTargetService(repo);
  const handler = NewSalesTargetHandler(svc);

  router.post("/sales-targets", middleware, handler.createSalesTarget);
  router.get("/sales-targets", middleware, handler.listSalesTargets);
  router.get("/sales-targets/:id", middleware, handler.getSalesTarget);
  router.patch("/sales-targets", middleware, handler.updateSalesTarget);
  router.patch("/sales-targets/:id", middleware, handler.deleteSalesTarget);
  router.get("/sales-target/performance", middleware, handler.salesPerformance);
  router.get("/cashsettlement-list", middleware, handler.getCashSettlementList);
  router.patch("/cashsettlement-status/:id", middleware, handler.updatCashSettlementStatus);
  router.get("/sales-target/newAddedWholesalerRetailer", middleware, handler.listNewAddedWholeSalerRetailer);
  router.get("/sales-target/achieved", middleware, handler.listAchievedSalesTargets);
}