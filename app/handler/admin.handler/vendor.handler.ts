import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { VendorDomainService } from "../../../domain/admin/vendorDomain";
import { vendorListQuerySchema, vendorSchema } from "../../../api/Request/vendor";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";

class VendorHandler {
    private service: VendorDomainService;

    constructor(service: VendorDomainService) {
        this.service = service;
    }

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = vendorSchema.safeParse(req.body);

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

            const response = await this.service.createVendor(result.data, userId);
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
            const result = vendorSchema.safeParse(req.body);

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
                    'Invalid vendor ID',
                    'INVALID_ID'
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

            const updateData: any = {
                ...result.data,
                id
            };

            const response = await this.service.updateVendor(updateData, userId);
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
                    'Invalid vendor ID',
                    'INVALID_ID'
                );
            }

            const response = await this.service.findVendorById(id);
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
            const queryResult = vendorListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY',
                    queryResult.error.errors
                );
            }

            const { page, limit, search, sort, type, format } = queryResult.data;

            const response = await this.service.getVendorList({
                page,
                limit,
                search,
                sort,
                type: type,
                vendorId: '',
                format
            });
            if (format === 'excel' && 'filename' in response && 'data' in response) {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=${response.filename}`);
                return res.send(response.data);
            }

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

            const response = await this.service.deleteVendor(id, userId);

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

    getProducts = async (req: Request, res: Response): Promise<any> => {
        try {
            const queryResult = vendorListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY',
                    queryResult.error.errors
                );
            }
            const vendorId = (req.query.vendorId as string) ?? ''
            // const vendorId = req.params.id;
            // if (!vendorId) {
            //     return sendErrorResponse(
            //         res,
            //         StatusCodes.BAD_REQUEST,
            //         'VendorId is required',
            //         'INVALID_QUERY',
            //         'VendorId is required'
            //     );
            // }

            const { page, limit, search, sort, type } = queryResult.data;

            const response = await this.service.getVendoBasedProductsList({
                page,
                limit,
                search,
                sort,
                type: type,
                vendorId: vendorId
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
}

export function NewVendorHandler(service: VendorDomainService): VendorHandler {
    return new VendorHandler(service);
}
