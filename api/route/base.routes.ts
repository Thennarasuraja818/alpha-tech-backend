import { Application, Request, Response } from "express";
import { _config } from "../../config/config";
import { RegisterAdminRoute } from "./admin.route";
import { MobileAppRoute } from "./mobile-app.route";
// import { WebsiteRoute } from "./website.route";
// import { newWebsiteUserRepository } from "../../infrastructure/Repository/website/user.repository";

export function setupRoutes(app: Application, db: any) {
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: `${_config?.Name} server running on port: ${_config?.Port}`,
    });
  });

  const apiRouter = require("express").Router();

  const adminRouter = require("express").Router();
  apiRouter.use("/admin", adminRouter);
  RegisterAdminRoute(adminRouter, db);

  // Mobile API (user) sub-router under /api/mobile-api
  const mobileRouter = require("express").Router();
  apiRouter.use("/mobile-api", mobileRouter);
  MobileAppRoute(mobileRouter, db);

  const websiteRouter = require("express").Router();
  apiRouter.use("/website", websiteRouter);
  // WebsiteRoute(websiteRouter, db);

  // Mount all /api routes
  app.use("/api", apiRouter);
}
