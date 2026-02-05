// infrastructure/routes/boxCash.route.ts
import { Router } from "express";
import { boxCashServiceFactory } from "../../../app/service/admin/boxCash.service";
import { boxCashHandler } from "../../../app/handler/admin.handler/boxCash.handler";
import { IBoxCashRepository } from "../../../domain/admin/boxCashDomain";
// import { boxCashRepository } from "../../../infrastructure/Repository/Admin/boxCash.repository";

export function RegisterBoxCashRoute(
    router: Router,
    pettyCashRepo: IBoxCashRepository,
    middleware: any
) {
    //   const repository: IBoxCashRepository = boxCashRepository();
    const service = boxCashServiceFactory(pettyCashRepo);
    const handler = boxCashHandler(service);

    router.post("/boxCash", middleware, handler.createTransaction);
    router.get("/boxCash", middleware, handler.getAllTransactions);
    router.get("/boxCash/summary", middleware, handler.getDailySummary);
    router.get("/boxCash/:id", middleware, handler.getTransactionById);
    router.put("/boxCash/:id", middleware, handler.updateTransaction);
    router.delete("/boxCash/:id", middleware, handler.deleteTransaction);
}