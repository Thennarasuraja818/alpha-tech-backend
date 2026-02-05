import { Router } from "express";
import { IBoxCashManagementRepository } from "../../../domain/admin/boxCashManagementDomain";
import { boxCashManagementServiceFactory } from "../../../app/service/admin/boxCashManagement.service";
import { boxCashManagementHandler } from "../../../app/handler/admin.handler/boxCashManagement.handler";

export function RegisterBoxCashManagementRoute(
    router: Router,
    boxCashManagementRepo: IBoxCashManagementRepository,
    middleware: any
) {
    const service = boxCashManagementServiceFactory(boxCashManagementRepo);
    const handler = boxCashManagementHandler(service);

    router.post("/box-cash-management", middleware, handler.createBoxCashManagement);
    router.get("/box-cash-management", middleware, handler.getAllBoxCashManagement);
    router.get("/box-cash-management/date/:date", middleware, handler.getBoxCashManagementByDate);
    router.get("/box-cash-management/:id", middleware, handler.getBoxCashManagementById);
    router.put("/box-cash-management/:id", middleware, handler.updateBoxCashManagement);
    router.delete("/box-cash-management/:id", middleware, handler.deleteBoxCashManagement);
}