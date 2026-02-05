import { Router } from "express";
import { HoldOrderServiceFun } from "../../../app/service/admin/holdOrder.service";
import { HoldOrderDomainRepository } from "../../../domain/admin/holdOrder.domain";
import { HoldOrderHandlerFun } from "../../../app/handler/admin.handler/holdOrder.handler";

export function RegisterHoldOrderRoute(
  router: Router,
  holdOrderRepo: HoldOrderDomainRepository,
  middleware: any
) {
  const service = HoldOrderServiceFun(holdOrderRepo);
  const handler = HoldOrderHandlerFun(service);

  // Create a new held order
  router.post("/hold-orders", middleware, handler.create);

  // Retrieve all active held orders
  router.get("/hold-orders", middleware, handler.list);


  // Update held order
  router.put("/hold-orders/:id", middleware, handler.update);


}
