import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { CouponDomainRepository, CouponListParams } from "../../../domain/admin/couponDomain";
import { Types } from "mongoose";
import { createErrorResponse } from "../../../utils/common/errors";
import { CreateCouponInput, UpdateCouponInput } from "../../../api/Request/coupon";
import { CouponModel } from "../../../app/model/coupon";
import { successResponse } from "../../../utils/common/commonResponse";
import { CouponDocumentResponse } from "../../../api/response/coupon.response";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";

export class CouponRepository implements CouponDomainRepository {
    constructor(private db: any) { }

    async findCouponExists(id: string): Promise<boolean | ErrorResponse> {
        try {
            const count = await CouponModel.countDocuments({ _id: new Types.ObjectId(id) });
            return count > 0;
        } catch (error: any) {
            return createErrorResponse(
                "Error checking coupon existence",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createCoupon(input: CreateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const couponData = {
                ...input,
                isActive: input.status ?? true,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
            };
            const existingCoupon = await CouponModel.findOne({
                code: input.code
            }).lean();

            if (existingCoupon) {
                return createErrorResponse(
                    "Coupon code already exists",
                    StatusCodes.BAD_REQUEST,
                    "A coupon with this code already exists. Please use a different code."
                );
            }

            await CouponModel.create(couponData);
            return successResponse(
                "Coupon created successfully",
                StatusCodes.CREATED
                , { message: '' }
            );
        } catch (error: any) {
            return createErrorResponse(
                "Error creating coupon",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateCoupon(input: UpdateCouponInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const { id, ...updateData } = input;
            if (updateData.code) {
                const existingCoupon = await CouponModel.findOne({
                    code: updateData.code,
                    _id: { $ne: new Types.ObjectId(id) }
                }).lean();

                if (existingCoupon) {
                    return createErrorResponse(
                        "Coupon code already exists",
                        StatusCodes.BAD_REQUEST,
                        "A coupon with this code already exists. Please use a different code."
                    );
                }
            }
            await CouponModel.updateOne(
                { _id: new Types.ObjectId(id) },
                {
                    $set: {
                        ...updateData,
                        ...(updateData.status !== undefined && { isActive: updateData.status }),
                        modifiedBy: new Types.ObjectId(userId),
                        updatedAt: new Date()
                    }
                }
            );
            return successResponse("Coupon updated successfully", StatusCodes.OK, { message: "Coupon updated successfully" });
        } catch (error: any) {
            return createErrorResponse(
                "Error updating coupon",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getCouponById(id: string): Promise<ApiResponse<CouponDocumentResponse> | ErrorResponse> {
        try {
            const coupon = await CouponModel.findOne({ _id: new Types.ObjectId(id), isDelete: false }).lean();
            if (!coupon) {
                return createErrorResponse(
                    "Coupon not found",
                    StatusCodes.NOT_FOUND,
                    "Coupon with given ID not found"
                );
            }

            const response: CouponDocumentResponse = {
                _id: new Types.ObjectId(coupon._id),
                name: coupon.name,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                modifiedBy: coupon.modifiedBy?.toString() || coupon.createdBy?.toString() || '',
                type: coupon.type,
                categoryId: coupon.categoryId?.map(id => id.toString()),
                productIds: coupon.productIds?.map(id => id.toString()),
                userIds: coupon.userIds?.map(id => id.toString()),
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                isActive: coupon.isActive,
                minOrderAmount: coupon?.minOrderAmount,
                usageLimit: coupon?.usageLimit,
                createdBy: coupon.createdBy?.toString() || '',
                createdAt: coupon.createdAt,
                updatedAt: coupon.updatedAt
            };

            return {
                status: 'success',
                statusCode: StatusCodes.OK,
                message: 'Coupon retrieved successfully',
                data: response
            };
        } catch (error: any) {
            return createErrorResponse(
                "Error fetching coupon",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getCouponList(params: CouponListParams): Promise<PaginationResult<CouponDocumentResponse[]> | ErrorResponse> {
        try {
            const { page, limit, search, code, discountType, isActive } = params;
            const filter: any = {
                isDelete: false
            };

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ];
            }

            if (code) filter.code = code;
            if (discountType) filter.discountType = discountType;
            if (isActive !== undefined) filter.isActive = isActive;

            const [coupons, total] = await Promise.all([
                CouponModel.find(filter)
                    .skip((page) * limit)
                    .limit(limit)
                    .lean(),
                CouponModel.countDocuments(filter)
            ]);

            return Pagination(total, coupons, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                "Error fetching coupons",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteCoupon(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            await CouponModel.updateOne(
                { _id: new Types.ObjectId(id) },
                {
                    $set: {
                        isActive: false,
                        isDelete: true,
                        modifiedBy: new Types.ObjectId(userId),
                    }
                }
            );
            return successResponse("Coupon deactivated successfully", StatusCodes.OK, { message: "Coupon deactivated successfully" });
        } catch (error: any) {
            return createErrorResponse(
                "Error deleting coupon",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewCouponRepository(db: any): CouponDomainRepository {
    return new CouponRepository(db);
}