import { Router } from "express";
import { NewRootServiceRegister } from "../../../app/service/admin/root.service";
import { RootDomainRepository } from "../../../domain/admin/root.Domain";
import { NewRootHandlerRegister } from "../../../app/handler/admin.handler/root.handler";

export function RegisterRootRoute(router: Router, repo: RootDomainRepository, middleware: any) {
  const svc = NewRootServiceRegister(repo);
  const handler = NewRootHandlerRegister(svc);

  router.post("/root", middleware, handler.createRoot);
  router.get("/root", middleware, handler.getAllRoot);
  router.get("/root/:id", middleware, handler.getRootById);
  router.patch("/root", middleware, handler.updateRoot);
  router.patch("/root/:id", middleware, handler.deleteRoot);
  router.post("/root/customer-variant", middleware, handler.createCustomerVariant);
  router.get("/root/customer-variant/list", middleware, handler.customerVariantList);
  router.patch("/root/customer-variant/retailer", middleware, handler.updateCustomerVariantForCustomer);
}