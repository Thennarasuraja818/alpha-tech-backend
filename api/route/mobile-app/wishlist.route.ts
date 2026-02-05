import { Router } from "express";
import { IWishListRepository } from "../../../domain/website/wishlist.domain";
import { webSiteWishlistService } from "../../../app/service/website/wishlist.service";
import { WishListHandlerFun } from "../../../app/handler/website.handler/wishlist.handler";

export function RegisterWishtRoute(
    router: Router,
    adminRepo: IWishListRepository,
    middleware: any
) {
    const service = webSiteWishlistService(adminRepo); // Pass repository to service
    const handler = WishListHandlerFun(service); // Pass service to handler
    router.post("/add-wishlist", handler.createWishList); // Define route
    router.get("/wishlist/:id", handler.getWishList); // Define route
    router.get("/wishlist-count/:id", handler.getWishListCount); // Define route
    router.get("/wishlist-details/:id", handler.getWishListDetails); // Define route
    router.delete("/wishlist/:id",  handler.deleteWishList); // Define route
}
