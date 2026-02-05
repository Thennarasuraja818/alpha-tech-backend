import { Router } from "express";
import { ExpenseTypeDomainRepository } from "../../../domain/admin/expense.typeDomain";
import { NewExpenseTypeServiceRegister } from "../../../app/service/admin/expense.type.service";
import { NewExpensetypeHandlerRegister } from "../../../app/handler/admin.handler/expense.type.handler";

export function RegisterExpensetypeRoute(router: Router, repo: ExpenseTypeDomainRepository, middleware: any) {
    const svc = NewExpenseTypeServiceRegister(repo);
    const handler = NewExpensetypeHandlerRegister(svc);

    router.post("/expense-type", middleware, handler.createExpenseType);
    router.get("/expense-type", middleware, handler.getAllExpenseType);
    router.get("/expense-type/:id", middleware, handler.getExpensetypeById);
    router.patch("/expense-type/:id", middleware, handler.updateExpensetype);
    router.delete("/expense-type/:id", middleware, handler.deleteExpenseType);
}