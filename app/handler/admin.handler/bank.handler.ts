import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { BankDomainService } from "../../../domain/admin/bankDomain";
import { Types } from "mongoose";
import { BankListQuerySchema, BankSchema } from "../../../api/Request/bank";

export class BankHandler {
    private bankService: BankDomainService;

    constructor(bankService: BankDomainService) {
        this.bankService = bankService;
    }

    createBank = async (req: Request, res: Response): Promise<any> => {
        try {
            const payload = req.body;
            const validation = BankSchema.safeParse(payload);

            if (!validation.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid bank data',
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

            const response = await this.bankService.createBank(validation.data, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    updateBank = async (req: Request, res: Response): Promise<any> => {
        try {
            const id = req.params?.id as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Bank ID is required', 'INVALID_PARAMS');
            }

            const payload = { ...req.body, id };
            const validation = BankSchema.safeParse(payload);

            if (!validation.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid bank data',
                    'VALIDATION_ERROR',
                    validation.error.errors
                );
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'User not authenticated', 'UNAUTHORIZED');
            }

            const response = await this.bankService.updateBank(validation.data, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    getBankDetails = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Bank ID is required', 'INVALID_PARAMS');
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Bank ID format', 'INVALID_PARAMS');
            }

            const response = await this.bankService.findBankById(id);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    getBankList = async (req: Request, res: Response): Promise<any> => {
        try {
            const queryResult = BankListQuerySchema.safeParse(req.query);
            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY_PARAMS',
                    queryResult.error.errors
                );
            }

            const { page, limit, search, sort, status } = queryResult.data;

            const response = await this.bankService.getBankList({
                page,
                limit,
                search,
                sort,
                status
            });

            return sendPaginationResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    deleteBank = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Bank ID is required', 'INVALID_PARAMS');
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Bank ID format', 'INVALID_PARAMS');
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'User not authenticated', 'UNAUTHORIZED');
            }

            const response = await this.bankService.deleteBank(id, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    toggleBankStatus = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Bank ID is required', 'INVALID_PARAMS');
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Bank ID format', 'INVALID_PARAMS');
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'User not authenticated', 'UNAUTHORIZED');
            }

            const response = await this.bankService.toggleBankStatus(id, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }
}

export function BankHandlerFun(service: BankDomainService): BankHandler {
    return new BankHandler(service);
}