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
            const vendorId = req.params.id as any;
            if (!vendorId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'VendorId is required',
                    'INVALID_QUERY',
                    'VendorId is required'
                );
            }

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

export function NewVendorPurchaseHandler(service: VendorDomainService): VendorHandler {
    return new VendorHandler(service);
}
