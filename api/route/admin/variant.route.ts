import { Router } from "express";
import { VariantDomainRepository } from "../../../domain/admin/variantDomain";
import { NewVariantService } from "../../../app/service/admin/variant.service";
import { NewVariantHandler } from "../../../app/handler/admin.handler/variant.handler";

export function RegisterNewVariantRoute(router: Router, repository: VariantDomainRepository, validateUser: any) {
    const service = NewVariantService(repository);
    const handler = NewVariantHandler(service);

    router.get("/variants/list", validateUser, handler.getList);
    router.post("/variants", validateUser, handler.create);
    router.get("/variants/:id", validateUser, handler.getById);
    router.put("/variants/:id", validateUser, handler.update);
    router.delete("/variants/:id", validateUser, handler.delete);
}
