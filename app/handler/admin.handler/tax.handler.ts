import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { TaxListQuerySchema, TaxSchema } from "../../../api/Request/tax";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { TaxDomainService } from "../../../domain/admin/taxDomain";
import { Types } from "mongoose";

export class TaxHandler {
    private taxService: TaxDomainService;

    constructor(taxService: TaxDomainService) {
        this.taxService = taxService;
    }

    createTax = async (req: Request, res: Response): Promise<any> => {
        try {
            const files = (req.files as any)?.image;
            const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
            const payload = { ...req.body, images };

            const validation = TaxSchema.safeParse(payload);
            if (!validation.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid tax data',
                    'VALIDATION_ERROR',
                    validation.error.errors
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

            const response = await this.taxService.createTax(validation.data, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    updateTax = async (req: Request, res: Response): Promise<any> => {
        try {
            const files = (req.files as any)?.image;
            const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
            const id = req.params?.id;

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Tax ID is required',
                    'INVALID_PARAMS'
                );
            }

            const payload = { ...req.body, id, images };
            const validation = TaxSchema.safeParse(payload);

            if (!validation.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid tax data',
                    'VALIDATION_ERROR',
                    validation.error.errors
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

            const response = await this.taxService.updateTax(validation.data, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    getTaxDetails = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Tax ID is required',
                    'INVALID_PARAMS'
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Tax ID format',
                    'INVALID_PARAMS'
                );
            }

            const response = await this.taxService.findTaxById(id);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    getTaxList = async (req: Request, res: Response): Promise<any> => {
        try {
            const queryResult = TaxListQuerySchema.safeParse(req.query);
            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY_PARAMS',
                    queryResult.error.errors
                );
            }

            const { page, limit, search, sort, taxType } = queryResult.data;

            const response = await this.taxService.getTaxList({
                page,
                limit,
                search,
                sort,
                taxType
            });

            return sendPaginationResponse(res, response);
        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    deleteTax = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Tax ID is required',
                    'INVALID_PARAMS'
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Tax ID format',
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

            const response = await this.taxService.deleteTax(id, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }

    toggleTaxStatus = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            console.log(id, "id")

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Tax ID is required',
                    'INVALID_PARAMS'
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Tax ID format',
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

            const response = await this.taxService.toggleTaxStatus(id, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }
}

export function TaxHandlerFun(service: TaxDomainService): TaxHandler {
    return new TaxHandler(service);
}