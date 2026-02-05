import { StatusCodes } from "http-status-codes";
import { brandListQuerySchema, brandSchema, updateBrandSchema } from "../../../api/Request/brand";
import { BrandDomainService } from "../../../domain/admin/brandDomain";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
class BrandHandler {
    private service: BrandDomainService

    constructor(service: BrandDomainService) {
        this.service = service
    }

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = brandSchema.safeParse(req.body);
            console.log(req.files?.logo, 'req.files?.logo');

            const logo = req.files?.logo
                ? Array.isArray(req.files.logo)
                    ? req.files.logo
                    : [req.files.logo]
                : [];


            if (!result.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid request body',
                    'INVALID_INPUT',
                    result.error.errors
                );
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }

            const response = await this.service.createBrand(result.data, logo, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    update = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Brand ID is required',
                    'INVALID_PARAMS'
                );
            }

            const logo = req.files?.logo
                ? Array.isArray(req.files.logo)
                    ? req.files.logo
                    : [req.files.logo]
                : [];



            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Brand ID format',
                    'INVALID_PARAMS'
                );
            }

            const result = updateBrandSchema.safeParse(req.body);
            if (!result.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid request body',
                    'INVALID_INPUT',
                    result.error.errors
                );
            }

            const updateData: any = {
                ...result.data,
                id
            };

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }

            const response = await this.service.updateBrand(updateData, logo, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    getBrandDetails = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Brand ID is required',
                    'INVALID_PARAMS'
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Brand ID format',
                    'INVALID_PARAMS'
                );
            }

            const response = await this.service.findBrandById(id);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    getBrandList = async (req: Request, res: Response): Promise<any> => {
        try {
            // Validate and transform query parameters
            const queryResult = brandListQuerySchema.safeParse(req.query);
            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY_PARAMS',
                    queryResult.error.errors
                );
            }

            // Get validated and transformed query params
            const { page, limit, search, sort, type } = queryResult.data;

            const finalPage = parseInt(page as string) || 0;
            const finalLimit = parseInt(limit as string) || 100;

            // Call service method with validated params
            const response = await this.service.getBrandList({
                page: finalPage,
                limit: finalLimit,
                search,
                sort,
                type
            });

            return sendPaginationResponse(res, response);
        } catch (error) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }
    delete = async (req: Request, res: Response): Promise<any> => {

        try {
            const { id } = req.params as any;

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Brand ID is required',
                    'INVALID_PARAMS'
                );
            }


            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Brand ID format',
                    'INVALID_PARAMS'
                );
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }

            const response = await this.service.deleteBrand(id, userId);

            return sendResponse(res, response);

        } catch (err: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }
}

export function NewBrandHandlerRegister(service: BrandDomainService): BrandHandler {
    return new BrandHandler(service)
}