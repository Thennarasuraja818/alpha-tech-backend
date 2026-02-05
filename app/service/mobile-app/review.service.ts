import { IMobileReviewRepository, MobileReviewServiceDomain } from "../../../domain/mobile-app/review.domain";
import { CreateReviewInput } from "../../../api/Request/review";

export function mobileReviewServiceFun(repo: IMobileReviewRepository): MobileReviewServiceDomain {
  return {
    createReview: (data: CreateReviewInput) => repo.createReview(data),
    getAllReviews: (params) => repo.getAllReviews(params),
    getReviewById: (id: string) => repo.getReviewById(id),
    updateReview: (id: string, data: CreateReviewInput) => repo.updateReview(id, data),
    deleteReview: (id: string) => repo.deleteReview(id),
  };
}