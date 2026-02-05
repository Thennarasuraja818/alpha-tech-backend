import { StatusCodes } from "http-status-codes";
import { CreateCouponInput, UpdateCouponInput } from "../../../api/Request/coupon";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { CouponDomainRepository, CouponDomainService, CouponListParams } from "../../../domain/admin/couponDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import { CouponDocumentResponse } from "../../../api/response/coupon.response";
import { PaginationResult } from "../../../api/response/paginationResponse";

export class CouponService implements CouponDomainService {
    private readonly repo: CouponDomainRepository;

    constructor(repo: CouponDomainRepository) {
        this.repo = repo;
    }

    async createCoupon(input: CreateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.repo.createCoupon(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating coupon',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateCoupon(input: UpdateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const exists = await this.repo.findCouponExists(input.id);
            if (typeof exists === 'object') return exists;
            if (!exists) {
                return createErrorResponse(
                    'Coupon not found',
                    StatusCodes.NOT_FOUND,
                    'Coupon with given ID not found'
                );
            }
            return await this.repo.updateCoupon(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error updating coupon',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getCouponById(id: string): Promise<ApiResponse<CouponDocumentResponse> | ErrorResponse> {
        try {
            const exists = await this.repo.findCouponExists(id);
            if (typeof exists === 'object') return exists;
            if (!exists) {
                return createErrorResponse(
                    'Coupon not found',
                    StatusCodes.NOT_FOUND,
                    'Coupon with given ID not found'
                );
            }
            return await this.repo.getCouponById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error fetching coupon',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getCouponList(params: CouponListParams): Promise<PaginationResult<CouponDocumentResponse[]> | ErrorResponse> {
        try {
            return await this.repo.getCouponList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error fetching coupons',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteCoupon(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const exists = await this.repo.findCouponExists(id);
            if (typeof exists === 'object') return exists;
            if (!exists) {
                return createErrorResponse(
                    'Coupon not found',
                    StatusCodes.NOT_FOUND,
                    'Coupon with given ID not found'
                );
            }
            return await this.repo.deleteCoupon(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error deleting coupon',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewCouponService(repo: CouponDomainRepository): CouponDomainService {
    return new CouponService(repo);
}