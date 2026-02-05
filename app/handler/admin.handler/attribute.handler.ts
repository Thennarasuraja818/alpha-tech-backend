import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { AttributeDomainService } from "../../../domain/admin/attributeDomain";
import { attributeListQuerySchema, attributeSchema } from "../../../api/Request/attribute";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";

class AttributeHandler {
    private service: AttributeDomainService;

    constructor(service: AttributeDomainService) {
        this.service = service;
    }

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = attributeSchema.safeParse(req.body);

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

            const response = await this.service.createAttribute(result.data, userId);
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
            const result = attributeSchema.safeParse(req.body);

            if (!result.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid request body',
                    'INVALID_INPUT',
                    result.error.errors
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid attribute ID',
                    'INVALID_ID'
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

            const response = await this.service.updateAttribute(updateData, userId);
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

    getById = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid attribute ID',
                    'INVALID_ID'
                );
            }

            const response = await this.service.findAttributeById(id);
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

    getList = async (req: Request, res: Response): Promise<any> => {
        try {
            const queryResult = attributeListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY',
                    queryResult.error.errors
                );
            }

            const { page, limit, search, sort, type } = queryResult.data;

            const response = await this.service.getAttributeList({
                page,
                limit,
                search,
                sort, type
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

            const response = await this.service.deleteAttribute(id, userId);

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

export function NewAttributeHandler(service: AttributeDomainService): AttributeHandler {
    return new AttributeHandler(service);
}
