import { Router } from "express";
import { ProductDomainRepository } from "../../../domain/mobile-app/productDomain";
import { NewProductServiceRegister } from "../../../app/service/mobile-app/product.service";
import { NewProductHandlerRegister } from "../../../app/handler/mobile-app/product.handler";

export async function RegisterNewProductRoute(route: Router, repo: ProductDomainRepository, middleware: any) {
    const service = NewProductServiceRegister(repo);
    const handler = NewProductHandlerRegister(service);
    route.get('/product/:id', handler.getById);
    route.get('/product/list/dtls', handler.getList);
    route.get('/product/list/toprated', handler.getTopRated);
    route.get('/product-categories/:id', handler.getProductByCategoryId);
}