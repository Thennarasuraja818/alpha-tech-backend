import { ApiResponse, ErrorResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { CouponDocumentResponse } from "../../api/response/coupon.response";
import { CreateCouponInput, UpdateCouponInput } from "../../api/Request/coupon";

export interface CouponListParams {
    page: number;
    limit: number;
    search?: string;
    code?: string;
    discountType?: string;
    isActive?: boolean;
}

export interface CouponDomainRepository {
    findCouponExists(id: string): Promise<boolean | ErrorResponse>;
    createCoupon(input: CreateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateCoupon(input: UpdateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getCouponById(id: string): Promise<ApiResponse<CouponDocumentResponse> | ErrorResponse>;
    getCouponList(params: CouponListParams): Promise<PaginationResult<CouponDocumentResponse[]> | ErrorResponse>;
    deleteCoupon(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface CouponDomainService {
    createCoupon(input: CreateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateCoupon(input: UpdateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getCouponById(id: string): Promise<ApiResponse<CouponDocumentResponse> | ErrorResponse>;
    getCouponList(params: CouponListParams): Promise<PaginationResult<CouponDocumentResponse[]> | ErrorResponse>;
    deleteCoupon(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}