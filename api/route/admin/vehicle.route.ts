import { Router } from "express";
import { VehicleDomainRepository } from "../../../domain/admin/vehicleDomain";
import { newVehicleService } from "../../../app/service/admin/vehicle.service";
import { VehicleHandlerFun } from "../../../app/handler/admin.handler/vehicle.handler";

export function RegisterVehicleRoute(
    router: Router,
    adminRepo: VehicleDomainRepository,
    middleware: any
) {
    const service = newVehicleService(adminRepo);   // repo → service
    const handler = VehicleHandlerFun(service);     // service → handler

    // Vehicle routes
    router.post("/vehicle", middleware, handler.createVehicle);
    router.put("/vehicle/:id", middleware, handler.updateVehicle);
    router.put("/vehicle/:id/toggle-status", middleware, handler.toggleVehicleStatus);
    router.delete("/vehicle/:id", middleware, handler.deleteVehicle);
    router.get("/vehicle/:id", middleware, handler.getVehicleDetails);
    router.get("/vehicle", middleware, handler.getVehicleList);
}
