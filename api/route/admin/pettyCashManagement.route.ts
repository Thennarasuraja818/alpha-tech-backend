import { Router } from "express";
import { pettyCashManagementHandler } from "../../../app/handler/admin.handler/pettyCashManagement.handler";
import { pettyCashManagementServiceFactory } from "../../../app/service/admin/pettyCashManagement.service";
import { IPettyCashManagementRepository } from "../../../domain/admin/pettyCashManagementDomain";

export function RegisterPettyCashManagementRoute(
  router: Router,
  pettyCashManagementRepo: IPettyCashManagementRepository,
  middleware: any
) {
  const service = pettyCashManagementServiceFactory(pettyCashManagementRepo);
  const handler = pettyCashManagementHandler(service);

  router.post("/pettyCashManagement", middleware, handler.createPettyCashManagement);
  router.get("/pettyCashManagement", middleware, handler.getAllPettyCashManagement);
  router.get("/pettyCashManagement/summary", middleware, handler.getDailyPettyCashManagementSummary);
  router.get("/pettyCashManagement/:id", middleware, handler.getPettyCashManagementById);
  router.put("/pettyCashManagement/:id", middleware, handler.updatePettyCashManagement);
  router.put("/pettyCashManagement-for-admin/:id", middleware, handler.updatePettyCashManagementForAdmin);

  router.delete("/pettyCashManagement/:id", middleware, handler.deletePettyCashManagement);

}
