import { Router } from "express";
import { BrandDomainRepository } from "../../../domain/admin/brandDomain";
import { NewBrandHandlerRegister } from "../../../app/handler/admin.handler/brand.handler";
import { NewBrandServiceRegister } from "../../../app/service/admin/brand.service";
import { NewAttributeService } from "../../../app/service/admin/attribute.service";
import { AttributeDomainRepository } from "../../../domain/admin/attributeDomain";
import { NewAttributeHandler } from "../../../app/handler/admin.handler/attribute.handler";

export async function RegisterNewAttributeRoute(route:Router, repo: AttributeDomainRepository, middleware:any){

    const service = NewAttributeService(repo)
    const handler = NewAttributeHandler(service)

    route.post('/attribute', middleware, handler.create)
    route.patch('/attribute/edit/:id', middleware, handler.update)
    route.get('/attribute/:id', middleware, handler.getById)
    route.get('/attribute/list/dtls', middleware, handler.getList)
    route.patch('/attribute/delete/:id', middleware, handler.delete);
}