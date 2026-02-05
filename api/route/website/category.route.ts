import { Router } from "express";
// import { IWebSiteUserRepository } from "../../../domain/website/user.domain";
import { ICategoryRepository } from "../../../domain/website/category.domain";
import { CategoryHandlerFun } from "../../../app/handler/website.handler/category.handler";
import { categoryServiceFun } from "../../../app/service/website/category.service";
export function RegisterCategoryRoute(
  router: Router,
  adminRepo: ICategoryRepository,
  middleware: any
) {
  const service = categoryServiceFun(adminRepo); // Pass repository to service
  const handler = CategoryHandlerFun(service); // Pass service to handler
//   router.post("/add-cart", handler.createCart); // Define route
//   router.get("/list", handler.getCart); // Define route
  router.get("/categories", handler.getAllCategories);
  router.get("/categories/:id", handler.getCategoryById);
}
