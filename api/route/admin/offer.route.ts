import { Router } from "express";
import { BrandDomainRepository } from "../../../domain/admin/brandDomain";
import { OfferService } from "../../../app/service/admin/offer.service";
import { OfferHandler } from "../../../app/handler/admin.handler/offer.handler";
import { OfferDomainRepository } from "../../../domain/admin/offerDomain";
export async function RegisterNewOfferRoute(route: Router, brandRepo: OfferDomainRepository, middleware: any) {

    const service = new OfferService(brandRepo)

    const handler = new OfferHandler(service)

    route.post('/offer', middleware, handler.create)
    route.patch('/offer/:id', middleware, handler.update)
    route.get('/offer/:id', middleware, handler.getById)
    route.get('/offer', middleware, handler.list)
    route.delete('/offer/:id', middleware, handler.delete);
}