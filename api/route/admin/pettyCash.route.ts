import { Router } from "express";
import { pettyCashHandler } from "../../../app/handler/admin.handler/pettyCash.handler";
import { pettyCashServiceFactory } from "../../../app/service/admin/pettyCash.service";
import { IPettyCashRepository } from "../../../domain/admin/pettyCashDomain";

export function RegisterPettyCashRoute(

router: Router,
pettyCashRepo: IPettyCashRepository,
middleware: any
) {
const service = pettyCashServiceFactory(pettyCashRepo);
const handler = pettyCashHandler(service);
router.post("/pettyCash", middleware, handler.createTransaction);
router.get("/pettyCash", middleware, handler.getAllTransactions);
router.get("/pettyCash/summary", middleware, handler.getDailySummary);
router.get("/pettyCash/:id", middleware, handler.getTransactionById);
router.put("/pettyCash/:id", middleware, handler.updateTransaction);
router.delete("/pettyCash/:id", middleware, handler.deleteTransaction);
}