import { Router } from "express";
import { BrandDomainRepository } from "../../../domain/admin/brandDomain";
import { NewBrandHandlerRegister } from "../../../app/handler/admin.handler/brand.handler";
import { NewBrandServiceRegister } from "../../../app/service/admin/brand.service";

export async function RegisterNewBrandRoute(route:Router, brandRepo: BrandDomainRepository, middleware:any){

    const service = NewBrandServiceRegister(brandRepo)

    const handler = NewBrandHandlerRegister(service)
   
    route.post('/brand', middleware, handler.create)
    route.patch('/brand/edit/:id', middleware, handler.update)
    route.get('/brand/:id', middleware, handler.getBrandDetails)
    route.get('/brand/list/dtls', middleware, handler.getBrandList)
    route.patch('/brand/delete/:id', middleware, handler.delete);
}