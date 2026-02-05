import { Router } from "express";
// import { IAdminRepository } from "../../../domain/admin/adminDomain";
// import { adminServiceFun } from "../../../app/service/admin/admin.service";
// import { AdminUserHandlerFun } from "../../../app/handler/admin.handler/admin.handler";
import { posServiceFun } from "../../../app/service/admin/pos.service";
import { PosServiceDomain } from "../../../domain/admin/posDomain";
import { newPosHandlerRegister } from "../../../app/handler/admin.handler/pos.handler";
export function RegisterPosRoute(
    router: Router,
    adminRepo: PosServiceDomain,
    middleware: any
) {
    const service = posServiceFun(adminRepo); // Pass repository to service  
    const handler = newPosHandlerRegister(service); // Pass service to handler
    router.post("/add-customer", middleware, handler.createCustomer); // Define route
    router.get("/customer-list", handler.getAllCustomers); // Define route
    router.get("/customer/:id", handler.getCustomerById); // Define route
    router.post("/create-order", middleware, handler.createOrder); // Define route
    router.post("/get-delivery-charge",middleware, handler.getDeliveryCharge)

}
