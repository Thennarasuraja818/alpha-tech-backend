import { Router } from "express";
import { ISubcategoryRepository } from "../../../domain/admin/subcategoryDomain";
import { subcategoryServiceFun } from "../../../app/service/admin/subcategory.service";
import { SubcategoryHandlerFun } from "../../../app/handler/admin.handler/subcategory.handler";

export function RegisterSubcategoryRoute(
  router: Router,
  subcategoryRepo: ISubcategoryRepository,
  middleware: any
) {
  const service = subcategoryServiceFun(subcategoryRepo);
  const handler = SubcategoryHandlerFun(service);

  router.post("/subcategories", middleware, handler.createSubcategory);
  router.get("/subcategories", middleware, handler.getAllSubcategories);
  router.get("/subcategories/category/:id", middleware, handler.getAllSubcategoriesByCategory);
  router.get("/subcategories/:id", middleware, handler.getSubcategoryById);
  router.put("/subcategories/:id", middleware, handler.updateSubcategory);
  router.delete("/subcategories/:id", middleware, handler.deleteSubcategory);
}
