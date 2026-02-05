import { Router } from "express";
import { IChildCategoryRepository } from "../../../domain/admin/childCategoryDomain";
import { childCategoryServiceFun } from "../../../app/service/admin/childCategory.service";
import { ChildCategoryHandlerFun } from "../../../app/handler/admin.handler/childCategory.handler";

export function RegisterChildCategoryRoute(
  router: Router,
  childCategoryRepo: IChildCategoryRepository,
  middleware: any
) {
  const service = childCategoryServiceFun(childCategoryRepo);
  const handler = ChildCategoryHandlerFun(service);

  router.post("/child-categories", middleware, handler.createChildCategory);
  router.get("/child-categories", middleware, handler.getAllChildCategories);
  router.get("/child-categories/subcategory/:id", middleware, handler.getAllChildCategoriesBySubcategory);
  router.get("/child-categories/:id", middleware, handler.getChildCategoryById);
  router.put("/child-categories/:id", middleware, handler.updateChildCategory);
  router.delete("/child-categories/:id", middleware, handler.deleteChildCategory);
}
