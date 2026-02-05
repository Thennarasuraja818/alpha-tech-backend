import { Router } from "express";
import { ProductDomainRepository } from "../../../domain/admin/productDomain";
import { NewProductServiceRegister } from "../../../app/service/admin/product.service";
import { NewProductHandlerRegister } from "../../../app/handler/admin.handler/product.handler";

export async function RegisterNewProductRoute(route: Router, repo: ProductDomainRepository, middleware: any) {
    const service = NewProductServiceRegister(repo);
    const handler = NewProductHandlerRegister(service);

    route.post('/product', middleware, handler.create);
    route.patch('/product/edit/:id', middleware, handler.update);
    route.get('/product/:id', middleware, handler.getById);
    route.get('/product/list/dtls', middleware, handler.getList);
    route.get('/product/active/list/dtls', middleware, handler.getActiveList);
    route.get('/product/list/current-stock', middleware, handler.getCurrentStock);
    route.patch('/product/delete/:id', middleware, handler.delete);

}