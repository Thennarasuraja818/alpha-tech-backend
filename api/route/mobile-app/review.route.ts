import { Router } from "express";
import { IMobileReviewRepository } from "../../../domain/mobile-app/review.domain";
import { mobileReviewServiceFun } from "../../../app/service/mobile-app/review.service";
import { ReviewHandlerFun } from "../../../app/handler/mobile-app/review.handler";

export function RegisterReviewRoute(
  router: Router,
  repo: IMobileReviewRepository,
  middleware: any
) {
  const service = mobileReviewServiceFun(repo);
  const handler = ReviewHandlerFun(service);

  router.post("/reviews", handler.createReview);
  router.get("/reviews", handler.getAllReviews);
  router.get("/reviews/:id", handler.getReviewById);
  router.put("/reviews/:id", handler.updateReview);
  router.delete("/reviews/:id", handler.deleteReview);
}