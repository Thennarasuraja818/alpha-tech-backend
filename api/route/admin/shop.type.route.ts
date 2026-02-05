import { Router } from "express";
import { ShopTypeDomainRepository } from "../../../domain/admin/shop.typeDomain";
import { NewShopTypeServiceRegister } from "../../../app/service/admin/shop.type.service";
import { NewShoptypeHandlerRegister } from "../../../app/handler/admin.handler/shop.type.handler";

export function RegisterShoptypeRoute(router: Router, repo: ShopTypeDomainRepository, middleware: any) {
    const svc = NewShopTypeServiceRegister(repo);
    const handler = NewShoptypeHandlerRegister(svc);

    router.post("/shop-type", middleware, handler.createShopType);
    router.get("/shop-type", middleware, handler.getAllShopType);
    router.get("/shop-type/:id", middleware, handler.getShoptypeById);
    router.patch("/shop-type/:id", middleware, handler.updateShoptype);
    router.delete("/shop-type/:id", middleware, handler.deleteShopType);
}