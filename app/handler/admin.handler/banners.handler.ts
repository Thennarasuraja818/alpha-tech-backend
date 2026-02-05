import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BannerListQuerySchema, BannerSchema } from "../../../api/Request/Banner";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { BannerDomainService } from "../../../domain/admin/bannerDomain";
import { Types } from "mongoose";

export class BannerHandler {
    private userService: BannerDomainService;

    constructor(userService: BannerDomainService) {
        this.userService = userService;
    }

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            const files = (req.files as any)?.image;
            const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
            const payload = { ...req.body, images };


            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }

            const response = await this.userService.createBanner(payload, userId);
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
            const files = (req.files as any)?.image;
            const images = files ? (Array.isArray(files) ? files : [files]) : undefined;

            const id = req.params?.id;
            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'Banner Id is required',
                    'Banner Id is required'
                );
            }
            const payload = { ...req.body, id, images };


            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }


            const response = await this.userService.updateBanner(payload, userId);
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
    getBannerDetails = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Banner ID is required',
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

            const response = await this.userService.findBannerById(id);
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

    getBannerList = async (req: Request, res: Response): Promise<any> => {
        try {
            // Validate and transform query parameters
            const queryResult = BannerListQuerySchema.safeParse(req.query);
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

            // Call service method with validated params
            const response = await this.userService.getBannerList({
                page,
                limit,
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

            const response = await this.userService.deleteBanner(id, userId);

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

export function BannerHandlerFun(service: BannerDomainService): BannerHandler {
    return new BannerHandler(service);
}