import { Router, Request, Response } from "express";
import { NewDashboardService } from "../../../app/service/admin/dashboard.service";
import { DashboardDomainRepository } from "../../../domain/admin/dashboard.domain";
import { NewDashboardHandler } from "../../../app/handler/admin.handler/dashboard.handler";

export function RegisterDashboardRoute(router: Router, repo: DashboardDomainRepository, middleware: any) {
  const svc = NewDashboardService(repo);
  const handler = NewDashboardHandler(svc);

  router.get("/dashboard/recent-customer", middleware, (req: Request, res: Response) => {
    handler.getRecentCustomer(req, res);
  });
  router.get("/dashboard/top-selling-product", middleware, (req: Request, res: Response) => {
    handler.getTopSellingProduct(req, res);
  });
  router.get("/dashboard/invoices", middleware, (req: Request, res: Response) => handler.getPaidOrdersList(req, res));
  router.get("/dashboard/by-month", middleware, (req: Request, res: Response) => handler.getSalesOverviewByMonth(req, res));
  router.get("/dashboard/sales-overview", middleware, (req: Request, res: Response) => handler.getSalesOverview(req, res));
}