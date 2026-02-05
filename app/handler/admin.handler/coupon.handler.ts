import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CouponDomainService } from "../../../domain/admin/couponDomain";
import { couponSchema, updateCouponSchema, couponListQuerySchema } from "../../../api/Request/coupon";
import { sendErrorResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";

export class CouponHandler {
    constructor(private service: CouponDomainService) { }

    async createCoupon(req: Request, res: Response) {
        try {
            const result = couponSchema.safeParse(req.body);
            if (!result.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid input data',
                    'INVALID_INPUT',
                    result.error.errors
                );
            }

            const userId = req.user?.id;
            const response = await this.service.createCoupon(result.data, userId);
            res.status(response.statusCode).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }

    async updateCoupon(req: Request, res: Response) {
        try {
            const result = updateCouponSchema.safeParse(req.body);
            if (!result.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid input data',
                    'INVALID_INPUT',
                    result.error.errors
                );
            }

            const userId = req.user?.id;
            const response = await this.service.updateCoupon(result.data, userId);
            res.status(response.statusCode).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }

    async getCouponById(req: Request, res: Response) {
        try {
            const { id } = req.params as any;
            if (!id || !Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid coupon ID',
                    'INVALID_ID'
                );
            }

            const response = await this.service.getCouponById(id);
            res.status(response.statusCode).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }

    async getCouponList(req: Request, res: Response) {
        try {
            const queryResult = couponListQuerySchema.safeParse(req.query);
            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY',
                    queryResult.error.errors
                );
            }

            const params = {
                page: parseInt(queryResult.data.page || '1'),
                limit: parseInt(queryResult.data.limit || '10'),
                search: queryResult.data.search,
                code: queryResult.data.code,
                discountType: queryResult.data.discountType,
                isActive: queryResult.data.isActive
            };

            const response = await this.service.getCouponList(params);
            res.status(StatusCodes.OK).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }

    async deleteCoupon(req: Request, res: Response) {
        try {
            const { id } = req.params as any;
            if (!id || !Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid coupon ID',
                    'INVALID_ID'
                );
            }

            const userId = req.user?.id;
            const response = await this.service.deleteCoupon(id, userId);
            res.status(response.statusCode).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }
}

export function NewCouponHandler(service: CouponDomainService): CouponHandler {
    return new CouponHandler(service);
}