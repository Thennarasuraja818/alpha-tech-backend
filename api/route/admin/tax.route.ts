import { Router } from "express";
import { TaxDomainRepository } from "../../../domain/admin/taxDomain";
import { newTaxService } from "../../../app/service/admin/tax.service";
import { TaxHandlerFun } from "../../../app/handler/admin.handler/tax.handler";

export function RegisterTaxRoute(
    router: Router,
    adminRepo: TaxDomainRepository,
    middleware: any
) {
    const service = newTaxService(adminRepo); // Pass repository to service
    const handler = TaxHandlerFun(service); // Pass service to handler

    // Define all tax routes
    router.post("/tax", middleware, handler.createTax);
    router.put("/tax/:id", middleware, handler.updateTax);
    router.put("/tax/:id/toggle-status", middleware, handler.toggleTaxStatus);
    router.delete("/tax/:id", middleware, handler.deleteTax);
    router.get("/tax/:id", middleware, handler.getTaxDetails);
    router.get("/tax", middleware, handler.getTaxList);
}