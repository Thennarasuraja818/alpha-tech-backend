import { Router } from "express";
import { ICategoryRepository } from "../../../domain/admin/categoryDomain";
import { categoryServiceFun } from "../../../app/service/admin/category.service";
import { CategoryHandlerFun } from "../../../app/handler/admin.handler/category.handler";

export function RegisterCategoryRoute(
  router: Router,
  categoryRepo: ICategoryRepository,
  middleware: any
) {
  const service = categoryServiceFun(categoryRepo);
  const handler = CategoryHandlerFun(service);

  router.post("/categories", middleware, handler.createCategory);
  router.get("/categories", middleware, handler.getAllCategories);
  router.get("/categories/:id", middleware, handler.getCategoryById);
  router.put("/categories/:id", middleware, handler.updateCategory);
  router.delete("/categories/:id", middleware, handler.deleteCategory);
}
