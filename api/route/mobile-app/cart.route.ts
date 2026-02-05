import { Router } from "express";
// import { IWebSiteUserRepository } from "../../../domain/website/user.domain";
import { ICartRepository } from "../../../domain/website/cart.domain";
import { CartHandlerFun } from "../../../app/handler/website.handler/cart.handler";
import { webSiteCartService } from "../../../app/service/website/cart.service";
export function RegisterCartRoute(
  router: Router,
  adminRepo: ICartRepository,
  middleware: any
) {
  const service = webSiteCartService(adminRepo); // Pass repository to service
  const handler = CartHandlerFun(service); // Pass service to handler
  router.post("/add-cart", handler.createCart); // Define route
  router.get("/cart-list/:id", handler.getCart); // Define route
  router.get("/cart-count/:id", handler.getCartCount); // Define route
  router.get("/cart-details/:id", handler.getCartDetails); // Define route
  router.delete("/cart/:id", handler.deleteCart); // Define route
}
