import { Router } from "express";
import { _config } from "../../config/config";
import { newMobileUserRepository } from "../../infrastructure/Repository/mobile-app/user.repository";
import { NewMobileAuthRegister } from "../middleware/mobile.user.middleware";
import { RegisterMobileUserRoute } from "./mobile-app/user.route";
import { RegisterCategoryRoute } from "./mobile-app/category.route";
import { newCategoryRepository } from "../../infrastructure/Repository/mobile-app/category.repository";
import { RegisterNewProductRoute } from "./mobile-app/product.route";
import { NewProductRepoistory } from "../../infrastructure/Repository/mobile-app/product.repository";
import { RegisterCartRoute } from "./mobile-app/cart.route";
import { RegisterSubCategoryRoute } from "./mobile-app/subCategory.route";
import { RegisterChildCategoryRoute } from "./mobile-app/childCategory.route";
import { newCartRepository } from "../../infrastructure/Repository/mobile-app/cart.repository";
import { newSubcategoryRepository } from "../../infrastructure/Repository/mobile-app/subcategory.repository";
import { newChildCategoryRepository } from "../../infrastructure/Repository/mobile-app/childCategory.repository";
import { MobileAuthMiddlewareService } from "../middleware/mobile.user.service";
import { WholesalerUserRoute } from "./mobile-app/wholesalerRetailer.route";
import { newWholesalerRepository } from "../../infrastructure/Repository/mobile-app/wholesaler.repository";
import { WholesalerAuthMiddlewareService } from "../middleware/wholesaler.service";
import { WholersalerAuthMiddlewareRegister } from "../middleware/wholesaler.middleware";
import { RegisterAdminUsersRoute } from "./mobile-app/admin.user.route";
import { newUserRepository } from "../../infrastructure/Repository/Admin/user.repository";
import { AdminUserAuthRegister } from "../middleware/admin.user.middleware";
import { AdminUserMiddlewareService } from "../middleware/admin.user.service";
import { RegisterOrderRoute } from "./mobile-app/order.route";
import { OrderRepository } from "../../infrastructure/Repository/mobile-app/order.repository";
import { RegisterAdminUserOrderRoute } from "./mobile-app/admin.user.order.route";
import { RegisterWholesalerOrderRoute } from "./mobile-app/wholesaler.order.route";
import { RegisterUseraddressRoute } from "./mobile-app/user.address.route";
import { UserAddressRepository } from "../../infrastructure/Repository/mobile-app/user.address.repository";
import { RegisterReviewRoute } from "./mobile-app/review.route";
import { newReviewRepository } from "../../infrastructure/Repository/mobile-app/review.repository";
import { NewBannerRepository } from "../../infrastructure/Repository/Admin/banner.repository";
import { RegisterBannerRoute } from "./mobile-app/banner.route";
import { RegisterWishtRoute } from "./mobile-app/wishlist.route";
import { newWishlistRepository } from "../../infrastructure/Repository/mobile-app/wishlist.repository";
import { RegisterReturnOrderRoute } from "./mobile-app/return.order.route";
import { ReturnOrderRepository } from "../../infrastructure/Repository/mobile-app/return.order.repository";
import { RegisterWholesalerReturnOrderRoute } from "./mobile-app/wholesaler.return.order.route";
import { RegisterNewOfferRoute } from "./website/offer.route";
import { OfferRepository } from "../../infrastructure/Repository/mobile-app/offer.repository";
import { LineManRepository } from "../../infrastructure/Repository/mobile-app/line-man.respository";
import { RegisterLinemanRoute } from "./mobile-app/line-man.route";
import { RegisterLineManReturnOrderRoute } from "./mobile-app/lineman-return-order.route";
import { DeliveryManRepository } from "../../infrastructure/Repository/mobile-app/deliveryman.repository";
import { RegisterDeliveryManRoute } from "./mobile-app/deliveryman.route";
import { RegisterRazorpayRoute } from "./mobile-app/razorpay.route";
import { RazorpayRepository } from "../../infrastructure/Repository/mobile-app/razorpay.repository";
export function setupRoutes(router: Router, db: any) {
  const adminRepo = newMobileUserRepository(db); // Create repository instance
  const adminAuthService = MobileAuthMiddlewareService(adminRepo)
  const adminmiddleware = NewMobileAuthRegister(adminAuthService)
  const wholesalerRepo = newWholesalerRepository(db);
  const wholesalerAuthService = WholesalerAuthMiddlewareService(wholesalerRepo);
  const wholesalerMiddleware = WholersalerAuthMiddlewareRegister(wholesalerAuthService);
  const adminUserRepo = newUserRepository(db);
  const adminUserAuthService = AdminUserMiddlewareService(adminUserRepo);
  const adminUserrMiddleware = AdminUserAuthRegister(adminUserAuthService);
  const offerRepo = new OfferRepository(db)

  // admin user routes (login, register)
  RegisterMobileUserRoute(router, adminRepo, adminmiddleware.ValidateUser);
  RegisterCategoryRoute(router, newCategoryRepository(db), adminmiddleware.ValidateUser);
  RegisterNewProductRoute(router, NewProductRepoistory(db), adminmiddleware.ValidateUser);
  RegisterCartRoute(router, newCartRepository(db), adminmiddleware.ValidateUser);
  RegisterSubCategoryRoute(router, newSubcategoryRepository(db), adminmiddleware.ValidateUser);
  RegisterChildCategoryRoute(router, newChildCategoryRepository(db), adminmiddleware.ValidateUser);

  // Wholesaler routes
  WholesalerUserRoute(router, newWholesalerRepository(db), adminUserrMiddleware.ValidateUser);
  RegisterAdminUsersRoute(router, newUserRepository(db), adminUserrMiddleware.ValidateUser);

  // Order routes
  RegisterOrderRoute(router, new OrderRepository(db), adminmiddleware.ValidateUser);
  RegisterAdminUserOrderRoute(router, new OrderRepository(db), adminUserrMiddleware.ValidateUser);
  RegisterWholesalerOrderRoute(router, new OrderRepository(db), wholesalerMiddleware.ValidateUser);
  RegisterUseraddressRoute(router, new UserAddressRepository(db), wholesalerMiddleware.ValidateUser);

  // Review routes
  RegisterReviewRoute(router, newReviewRepository(db), adminmiddleware.ValidateUser);
  RegisterBannerRoute(router, NewBannerRepository(db), adminmiddleware.ValidateUser)
  RegisterWishtRoute(router, newWishlistRepository(db), adminmiddleware.ValidateUser);
  RegisterReturnOrderRoute(router, new ReturnOrderRepository(db), adminmiddleware.ValidateUser);
  RegisterWholesalerReturnOrderRoute(router, new ReturnOrderRepository(db), wholesalerMiddleware.ValidateUser)
  RegisterNewOfferRoute(router, offerRepo, adminmiddleware.ValidateUser)

  // Line Man Route
  RegisterLinemanRoute(router, LineManRepository(db), adminUserrMiddleware.ValidateUser)
  RegisterLineManReturnOrderRoute(router, new ReturnOrderRepository(db), adminUserrMiddleware.ValidateUser);

  RegisterRazorpayRoute(router, new RazorpayRepository(db), adminUserrMiddleware.ValidateUser)


  // Delivery man routes
  RegisterDeliveryManRoute(router, new DeliveryManRepository(db), adminUserrMiddleware.ValidateUser)
}

export { setupRoutes as MobileAppRoute };
