import { Router } from "express";
import { VendorDomainRepository } from "../../../domain/admin/vendorDomain";
import { NewVendorService } from "../../../app/service/admin/vendor.service";
import { NewVendorHandler } from "../../../app/handler/admin.handler/vendor.handler";

export async function RegisterNewVendorRoute(route:Router, Repo: VendorDomainRepository, middleware:any){

    const service = NewVendorService(Repo)
    const handler = NewVendorHandler(service)

    route.post('/vendor', middleware, handler.create)
    route.patch('/vendor/edit/:id', middleware, handler.update)
    route.get('/vendor/:id', middleware, handler.getById)
    route.get('/vendor/list/dtls', middleware, handler.getList)
    route.patch('/vendor/delete/:id', middleware, handler.delete)

}