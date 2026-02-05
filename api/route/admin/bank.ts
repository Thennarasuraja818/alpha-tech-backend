import { Router } from "express";
import { BankDomainRepository } from "../../../domain/admin/bankDomain";
import { newBankService } from "../../../app/service/admin/bank.service";
import { BankHandlerFun } from "../../../app/handler/admin.handler/bank.handler";

export function RegisterBankRoute(
    router: Router,
    adminRepo: BankDomainRepository,
    middleware: any
) {
    const service = newBankService(adminRepo);   // repo → service
    const handler = BankHandlerFun(service);     // service → handler

    // Bank routes
    router.post("/bank", middleware, handler.createBank);
    router.put("/bank/:id", middleware, handler.updateBank);
    router.put("/bank/:id/toggle-status", middleware, handler.toggleBankStatus);
    router.delete("/bank/:id", middleware, handler.deleteBank);
    router.get("/bank/:id", middleware, handler.getBankDetails);
    router.get("/bank", middleware, handler.getBankList);
}