import { Router } from "express";
import { DeliverymanDomainRepository } from "../../../domain/mobile-app/deliverymanDomain";
import { DeliveryManService } from "../../../app/service/mobile-app/deliveryMan.service";
import { DeliveryManHandler } from "../../../app/handler/mobile-app/deliveryman.handler";

export async function RegisterDeliveryManRoute(route: Router, brandRepo: DeliverymanDomainRepository, middleware: any) {

    const service = new DeliveryManService(brandRepo)
    const handler = new DeliveryManHandler(service)

    route.post('/deliveryman', middleware, handler.create)
    route.patch('/deliveryman', middleware, handler.update)
    route.get('/deliveryman/orders', middleware, handler.deliveryManOrderList)
    route.post('/vehicle-complaint', middleware, handler.createVehicleComplaint)
    route.patch('/vehicle-complaint/:id', middleware, handler.updateVehicleComplaint)
    route.get('/deliveryman/complaintlist', middleware, handler.deliveryComplaintList)
    route.post('/deliveryman/order-status/:id', middleware, handler.updateDeliveryStatus)
    route.post('/deliveryman/request', middleware, handler.createRequesy)
    route.get('/deliveryman/request/list', middleware, handler.requestList)
    route.post('/deliveryman/return/pickedup', middleware, handler.createReturnPickedUp)
    route.get('/deliveryman/return/pickedup/list', middleware, handler.returnPickedUpList)
    route.post('/deliveryman/return/pickedup/settlement', middleware, handler.returnPickedUpSettlement)
    route.get('/deliveryman/kilometer-details', middleware, handler.getKilometerDetails)

}