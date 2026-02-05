import { Router } from "express";
// import { IWebSiteUserRepository } from "../../../domain/website/user.domain";
import { IChildCategoryRepository } from "../../../domain/website/childCategory.domain";
import { ChildCategoryHandlerFun } from "../../../app/handler/website.handler/childCategory.handler";
import { childCategoryServiceFun } from "../../../app/service/website/childCategory.service";
export function RegisterChildCategoryRoute(
  router: Router,
  adminRepo: IChildCategoryRepository,
  middleware: any
) {
  const service = childCategoryServiceFun(adminRepo); // Pass repository to service
  const handler = ChildCategoryHandlerFun(service); // Pass service to handler
  router.get("/child-categories", handler.getAllChildCategories);
  router.get("/child-categories/:id", handler.getChildCategoryById);
}
