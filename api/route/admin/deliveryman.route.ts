import { Router } from "express";
import { DeliverymanDomainRepository } from "../../../domain/admin/deliverymanDomain";
import { DeliveryManService } from "../../../app/service/admin/deliveryMan.service";
import { DeliveryManHandler } from "../../../app/handler/admin.handler/deliveryman.handler";

export async function RegisterDeliveryManRoute(route: Router, brandRepo: DeliverymanDomainRepository, middleware: any) {

    const service = new DeliveryManService(brandRepo)
    const handler = new DeliveryManHandler(service)
    route.get('/deliveryman/orders', middleware, handler.deliveryManOrderList)
    route.get('/deliveryman/complaintlist', middleware, handler.deliveryComplaintList)
    route.patch('/deliveryman/complaint-status/:id', middleware, handler.updateComplaintStatus)
    route.patch('/deliveryman/request-status/:id', middleware, handler.updateRequestStatus)
    route.get('/deliveryman/request/list', middleware, handler.requestList)

}