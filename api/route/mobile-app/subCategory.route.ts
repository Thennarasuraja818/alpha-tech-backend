import { Router } from "express";
// import { IWebSiteUserRepository } from "../../../domain/website/user.domain";
import { ISubcategoryRepository } from "../../../domain/website/subcategory.domain"
import { SubcategoryHandlerFun } from "../../../app/handler/website.handler/subCategory.handler";
import { subcategoryServiceFun } from "../../../app/service/website/subCategory.service";
export function RegisterSubCategoryRoute(
  router: Router,
  adminRepo: ISubcategoryRepository,
  middleware: any
) {
  const service = subcategoryServiceFun(adminRepo); // Pass repository to service
  const handler = SubcategoryHandlerFun(service); // Pass service to handler
//   router.post("/add-cart", handler.createCart); // Define route
//   router.get("/list", handler.getCart); // Define route
  router.get("/subcategories", handler.getAllSubcategories);
  router.get("/subcategories/:id", handler.getSubcategoryById);
}
