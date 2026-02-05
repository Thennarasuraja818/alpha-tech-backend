import { Router } from "express";
import { BannerDomainRepository } from "../../../domain/admin/bannerDomain";
import { newBannerService } from "../../../app/service/admin/banner.service";
import { BannerHandlerFun } from "../../../app/handler/admin.handler/banners.handler";
export function RegisterBannerRoute(
    router: Router,
    adminRepo: BannerDomainRepository,
    middleware: any
) {
    const service = newBannerService(adminRepo); // Pass repository to service  
    const handler = BannerHandlerFun(service); // Pass service to handler
    router.post("/banner", middleware, handler.create); // Define route
    router.patch("/banner/:id", middleware, handler.update); // Define route
    router.delete("/banner/:id", middleware, handler.delete); // Define route
    router.get("/banner/:id", middleware, handler.getBannerDetails); // Define route
    router.get("/banner", handler.getBannerList); // Define route
}
