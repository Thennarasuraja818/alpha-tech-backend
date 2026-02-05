import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendErrorResponse, sendPaginationResponse, } from "../../../utils/common/commonResponse";
import { PaymentServiceDomain } from "../../../domain/admin/paymentDomain";

export class PaymentHandler {
    private userService: PaymentServiceDomain;

    constructor(userService: PaymentServiceDomain) {
        this.userService = userService;
    }

    list = async (req: Request, res: Response): Promise<any> => {
        try {
            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 100;
            const type = req.query.type as string || undefined;
            const orderType = req.query.orderType as string || undefined;
            const Id = req.query.Id as string || undefined;
            const status = req.query.status as string || undefined;
            const orderCode = req.query.orderCode as string || undefined;
            const result = await this.userService.orderlists({ page, limit, type, orderType, Id, status, orderCode });
            sendPaginationResponse(res, result);
        } catch (err: any) {
            sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR',
                err.message
            );
        }
    };
    unpaidlist = async (req: Request, res: Response): Promise<any> => {
        try {
            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 100;
            const result = await this.userService.unpaidorderlists({ page, limit });
            sendPaginationResponse(res, result);
        } catch (err: any) {
            sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR',
                err.message
            );
        }
    };
    dailypaymentlist = async (req: Request, res: Response): Promise<any> => {
        try {
            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 100;
            const result = await this.userService.dailypaymentlists({ page, limit });
            sendPaginationResponse(res, result);
        } catch (err: any) {
            sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR',
                err.message
            );
        }
    };
}

export function PaymentHandlerFun(
    service: PaymentServiceDomain
): PaymentHandler {
    return new PaymentHandler(service);
}
