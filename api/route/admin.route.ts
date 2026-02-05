import { Application, Request, Response, Router } from "express";
import { _config } from "../../config/config";
import { newAdminUserRepository } from "../../infrastructure/Repository/Admin/admin.repository";
import { newUserRepository } from "../../infrastructure/Repository/Admin/user.repository";
import { NewCouponRepository } from "../../infrastructure/Repository/Admin/coupon.repository";
import { AdminAuthMiddlewareService } from "../middleware/admin.auth.service";
import { newCategoryRepository } from "../../infrastructure/Repository/Admin/category.repository";
import { RegisterCategoryRoute } from "./admin/category.route";
import { newSubcategoryRepository } from "../../infrastructure/Repository/Admin/subcategory.repository";
import { RegisterSubcategoryRoute } from "./admin/subcategory.route";
import { newChildCategoryRepository } from "../../infrastructure/Repository/Admin/childCategory.repository";
import { RegisterChildCategoryRoute } from "./admin/childCategory.route";
import { NewAdminAuthRegister } from "../middleware/admin.middleware";
import { RegisterAdminRoute as RegisterAdminUserRoute } from "./admin/admin.user.route";
import { WholeSaleOrderRoute } from "./admin/wholesale.order.route";
import { newWholesaleOrderRepository } from "../../infrastructure/Repository/Admin/wholesaleOrder.repository";
import { RegisterNewAttributeRoute } from "./admin/attribute.route";
import { RegisterNewBrandRoute } from "./admin/brand.route";
import { NewVendorRepository } from "../../infrastructure/Repository/Admin/vendor.repository";
import { RegisterNewVendorRoute } from "./admin/vendor.route";
import { RegisterNewProductRoute } from "./admin/product.route";
import { NewProductRepoistory } from "../../infrastructure/Repository/Admin/product.repository";
import { NewAttributeRepository } from "../../infrastructure/Repository/Admin/attribute.repository";
import { NewBrandRrpository } from "../../infrastructure/Repository/Admin/brand.repository";
import { RegisterUserRoute } from "./admin/user.route";
import { RegisterUserRoleRoute } from "./admin/userRole.route";
import { newUserRoleRepository } from "../../infrastructure/Repository/Admin/userRole.repository";
import { newWholesalerRepository } from "../../infrastructure/Repository/mobile-app/wholesaler.repository";
import { RegisterBannerRoute } from "./admin/banner.route";
import { NewBannerRepository } from "../../infrastructure/Repository/Admin/banner.repository";
import { newVendorPurchaseRepository, PurchaseRepository } from "../../infrastructure/Repository/Admin/purchase.repository";
import { RegisterPurchaseRoute } from "./admin/purchase.route";
import { RegisterPosRoute } from "./admin/pos.route";
import { newPosRepository } from "../../infrastructure/Repository/Admin/pos.repository";
import { RegisterNewRootReposiorty } from "../../infrastructure/Repository/Admin/root.repository";
import { RegisterRootRoute } from "./admin/root.route";
import { RegisterCouponRoute } from "./admin/coupon.route";
import { RegisterNewOfferRoute } from "./admin/offer.route";
import { OfferRepository } from "../../infrastructure/Repository/Admin/offer.repository";
import { RegisterTaxRoute } from "./admin/tax.route";
import { NewTaxRepository } from "../../infrastructure/Repository/Admin/tax.respository";
import { newUserOrderRepository } from "../../infrastructure/Repository/Admin/user.order";
import { RegisterUserOrderRoute } from "./admin/user.order";
import { RegisterPettyCashRoute } from "./admin/pettyCash.route";
import { pettyCashRepository } from "../../infrastructure/Repository/Admin/pettyCash.repository";
import { RegisterSalesAndTargetsRoute } from "./admin/salesAndTargets.route";
import { SalesTargetRepository } from "../../infrastructure/Repository/Admin/salesAndTargets.repository";
import { PaymentRoute } from "./admin/payment.route";
import { newPaymentRepository, PaymentReposity } from "../../infrastructure/Repository/Admin/payment.repository";
import { RegisterDashboardRoute } from './admin/dashboard.route';
import { DashboardRepository } from "../../infrastructure/Repository/Admin/dashboard.repository";
import { DeliveryManRepository } from "../../infrastructure/Repository/Admin/deliveryman.repository";
import { RegisterDeliveryManRoute } from "./admin/deliveryman.route";
import { RegisterBoxCashRoute } from "./admin/boxCash.route"
import { boxCashRepository } from "../../infrastructure/Repository/Admin/boxCash.repository";
import { RegisterBoxCashManagementRoute } from "./admin/boxCashManagement.route"
import { BoxCashManagementRepository } from "../../infrastructure/Repository/Admin/boxCashManagement.repository";
import { RegisterPettyCashManagementRoute } from "./admin/pettyCashManagement.route";
import { PettyCashManagementRepository } from "../../infrastructure/Repository/Admin/pettyCashManagement.repository";
import { WholesalerUserRoute } from "./mobile-app/wholesalerRetailer.route";
import { WholesalerAdminRoute } from "./admin/wholesalerRetailer.route";
import { newWholesalerRetailerRepository } from "../../infrastructure/Repository/Admin/wholesaler.repository";
import { RegisterNewShopTypeReposiorty } from "../../infrastructure/Repository/Admin/shop.type.repository";
import { RegisterShoptypeRoute } from "./admin/shop.type.route";
import { RegisterVehicleRoute } from "./admin/vehicle.route";
import { NewVehicleRepository } from "../../infrastructure/Repository/Admin/vehicle.repository";
import { NewBankRepository } from "../../infrastructure/Repository/Admin/bank.repository";
import { RegisterBankRoute } from "./admin/bank";
import { RegisterNewExpenseTypeReposiorty } from "../../infrastructure/Repository/Admin/expense.type.repository";
import { RegisterExpensetypeRoute } from "./admin/expense.type.route";
import { RegisterCrmOrderRoute } from "./admin/crm.route";
import { CrmOrderRepository } from "../../infrastructure/Repository/Admin/crm.repository";
import { newHoldOrderRepository } from "../../infrastructure/Repository/Admin/holdOrder.repository";
import { RegisterHoldOrderRoute } from "./admin/hold.route";

export function setupRoutes(router: Router, db: any) {

  const adminRepo = newAdminUserRepository(db); // Create repository instance
  const adminAuthService = AdminAuthMiddlewareService(adminRepo)
  const adminmiddleware = NewAdminAuthRegister(adminAuthService)



  const userRepo = newUserRepository(db);
  const userRoleRepo = newUserRoleRepository(db)
  // const adminAuthService = AdminAuthMiddlewareService(userRepo)

  const attributeRepo = NewAttributeRepository(db)
  const brandRepo = NewBrandRrpository(db)
  const vendorRepo = NewVendorRepository(db)
  const productRepo = NewProductRepoistory(db)

  const taxRepo = NewTaxRepository(db)
  const wholesalerRepo = newWholesalerRepository(db)
  const rootRepo = RegisterNewRootReposiorty(db)
  const offerRepo = new OfferRepository(db)
  const dashboardRepo = new DashboardRepository(db)
  const couponRepo = NewCouponRepository(db)
  const userOrder = newUserOrderRepository(db)
  const pettyCashRepo = pettyCashRepository()
  const vehicleRepo = NewVehicleRepository(db)
  const bankRepo = NewBankRepository(db)
  const crmRepo = new CrmOrderRepository(db)
  const pettyCashManagementRepo = new PettyCashManagementRepository()
  const boxCashRepo = boxCashRepository()
  const boxCashManagementRepo = new BoxCashManagementRepository()
  const wholesalerAdminRepo = newWholesalerRetailerRepository(db)
  const holdOrder = newHoldOrderRepository()

  // admin user routes (login, register)
  RegisterAdminUserRoute(router, adminRepo, adminmiddleware.ValidateUser);
  RegisterUserRoute(router, userRepo, adminmiddleware.ValidateUser);
  RegisterUserRoleRoute(router, userRoleRepo, adminmiddleware.ValidateUser)


  RegisterCategoryRoute(router, newCategoryRepository(), adminmiddleware.ValidateUser);
  RegisterSubcategoryRoute(router, newSubcategoryRepository(), adminmiddleware.ValidateUser);
  RegisterChildCategoryRoute(router, newChildCategoryRepository(), adminmiddleware.ValidateUser);
  WholeSaleOrderRoute(router, newWholesaleOrderRepository(), adminmiddleware.ValidateUser)
  RegisterNewAttributeRoute(router, attributeRepo, adminmiddleware.ValidateUser)
  RegisterNewBrandRoute(router, brandRepo, adminmiddleware.ValidateUser)
  RegisterNewVendorRoute(router, vendorRepo, adminmiddleware.ValidateUser)
  RegisterNewProductRoute(router, productRepo, adminmiddleware.ValidateUser)
  WholesalerUserRoute(router, wholesalerRepo, adminmiddleware.ValidateUser)
  RegisterBannerRoute(router, NewBannerRepository(db), adminmiddleware.ValidateUser)
  RegisterPurchaseRoute(router, newVendorPurchaseRepository(db), adminmiddleware.ValidateUser)
  RegisterPosRoute(router, newPosRepository(), adminmiddleware.ValidateUser)
  RegisterRootRoute(router, rootRepo, adminmiddleware.ValidateUser)
  RegisterCouponRoute(router, NewCouponRepository(db), adminmiddleware.ValidateUser)
  RegisterTaxRoute(router, taxRepo, adminmiddleware.ValidateUser)
  RegisterUserOrderRoute(router, userOrder, adminmiddleware.ValidateUser)
  RegisterPettyCashRoute(router, pettyCashRepo, adminmiddleware.ValidateUser)
  RegisterPettyCashManagementRoute(router, pettyCashManagementRepo, adminmiddleware.ValidateUser)
  RegisterUserOrderRoute(router, userOrder, adminmiddleware.ValidateUser)
  RegisterSalesAndTargetsRoute(router, new SalesTargetRepository(db), adminmiddleware.ValidateUser)
  PaymentRoute(router, newPaymentRepository(), adminmiddleware.ValidateUser)
  RegisterNewOfferRoute(router, offerRepo, adminmiddleware.ValidateUser)
  RegisterDashboardRoute(router, dashboardRepo, adminmiddleware.ValidateUser);
  RegisterDeliveryManRoute(router, new DeliveryManRepository(db), adminmiddleware.ValidateUser)
  RegisterBoxCashRoute(router, boxCashRepo, adminmiddleware.ValidateUser)
  RegisterBoxCashManagementRoute(router, boxCashManagementRepo, adminmiddleware.ValidateUser)
  WholesalerAdminRoute(router, wholesalerAdminRepo, adminmiddleware.ValidateUser)
  RegisterShoptypeRoute(router, RegisterNewShopTypeReposiorty(db), adminmiddleware.ValidateUser)
  RegisterVehicleRoute(router, vehicleRepo, adminmiddleware.ValidateUser)
  RegisterBankRoute(router, bankRepo, adminmiddleware.ValidateUser)
  RegisterExpensetypeRoute(router, RegisterNewExpenseTypeReposiorty(db), adminmiddleware.ValidateUser)
  RegisterCrmOrderRoute(router, crmRepo, adminmiddleware.ValidateUser)
  RegisterHoldOrderRoute(router, holdOrder, adminmiddleware.ValidateUser)

}

export { setupRoutes as RegisterAdminRoute };
