import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CreateReviewInput } from "../../api/Request/review";

export interface reviewDomains {
  limit: number;
  page: number;
  productId: string

}

export interface IMobileReviewRepository {
  createReview(data: CreateReviewInput): Promise<ApiResponse<any> | ErrorResponse>;
  getAllReviews(params: reviewDomains): Promise<ApiResponse<any> | ErrorResponse>;
  getReviewById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
  updateReview(id: string, data: CreateReviewInput): Promise<ApiResponse<any> | ErrorResponse>;
  deleteReview(id: string): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface MobileReviewServiceDomain {
  createReview(data: CreateReviewInput): Promise<ApiResponse<any> | ErrorResponse>;
  getAllReviews(params: reviewDomains): Promise<ApiResponse<any> | ErrorResponse>;
  getReviewById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
  updateReview(id: string, data: CreateReviewInput): Promise<ApiResponse<any> | ErrorResponse>;
  deleteReview(id: string): Promise<ApiResponse<any> | ErrorResponse>;
}