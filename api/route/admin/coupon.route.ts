import { Router, Request, Response } from "express";
import { NewCouponService } from "../../../app/service/admin/coupon.service";
import { CouponDomainRepository } from "../../../domain/admin/couponDomain";
import { NewCouponHandler } from "../../../app/handler/admin.handler/coupon.handler";

export function RegisterCouponRoute(router: Router, repo: CouponDomainRepository, middleware: any) {
  const svc = NewCouponService(repo);
  const handler = NewCouponHandler(svc);

  router.post("/coupons", middleware, (req: Request, res: Response) => {
    handler.createCoupon(req, res);
  });
  router.get("/coupons", middleware, (req: Request, res: Response) => {
    handler.getCouponList(req, res);
  });
  router.get("/coupons/:id", middleware, (req: Request, res: Response) => {
    handler.getCouponById(req, res);
  });
  router.put("/coupons/:id", middleware, (req: Request, res: Response) => {
    handler.updateCoupon(req, res);
  });
  router.patch("/coupons/:id", middleware, (req: Request, res: Response) => {
    handler.deleteCoupon(req, res);
  });
}