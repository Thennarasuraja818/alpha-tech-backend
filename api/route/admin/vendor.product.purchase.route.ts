import { Router } from "express";
import { VendorDomainRepository } from "../../../domain/admin/vendorDomain";
import { NewVendorService } from "../../../app/service/admin/vendor.service";
import { NewVendorHandler } from "../../../app/handler/admin.handler/vendor.handler";

export async function RegisterNewVendorPurchaseRoute(route:Router, Repo: VendorDomainRepository, middleware:any){

    const service = NewVendorService(Repo)
    const handler = NewVendorHandler(service)
    route.get('/vendor/product/:id',middleware,handler.getProducts)

}