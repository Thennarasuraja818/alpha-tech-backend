import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
    sendErrorResponse,
    sendResponse,
    sendPaginationResponse,
} from '../../../utils/common/commonResponse';
import { Types } from 'mongoose';
import { logUserActivity } from '../../../utils/utilsFunctions/user.activity';
import { ReturnOrderDomainService } from '../../../domain/mobile-app/returnOrderDomain';
import { createOrderSchema, CreateReturnOrderInput, updateOrderSchema, updateOrderStatusSchema, UpdateReturnOrderInput } from '../../../api/Request/return.order';
import { logAdminUserActivity } from '../../../utils/utilsFunctions/admin.users.activity';

class ReturnOrderHandler {
    constructor(private service: ReturnOrderDomainService) { }

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = createOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }
            const data: CreateReturnOrderInput = parsed.data;
            data.returnOrderFrom = data.placedByModel === 'AdminUser' ? 'lineman-app' : 'wholesaler-app';

            const result = await this.service.create(data, req.user!.id);
            if (result) {
                // Insert User Activity
                if (data.placedByModel === 'User') {
                    await logUserActivity(new Types.ObjectId(data.placedBy), req, req.user.email, 'Return or Exchange Order Placed');
                }
                if (data.placedByModel === 'AdminUser') {
                    await logAdminUserActivity(new Types.ObjectId(req.user.id), req, req.user.email, 'Return or Exchange Order Placed');
                }

            }
            sendResponse(res, result);
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

    list = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id ?? '';
            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 0;
            const type = req.query.type as string || 'wholesaler';
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.service.list({ page, limit, type, userId });
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

    update = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.params as any;
        if (!Types.ObjectId.isValid(id)) {
            sendErrorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                'Invalid Order ID format',
                'INVALID_PARAMS'
            );
        }

        try {
            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }

            const parsed = updateOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }
            const data: UpdateReturnOrderInput = parsed.data;
            const result = await this.service.update(id, data, req.user!.id);
            if (result) {
                if (data.placedByModel === 'User') {
                    await logUserActivity(new Types.ObjectId(userId), req, req.user.email, 'Order Updated');
                }
            }

            sendResponse(res, result);
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
    delete = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.params as any;
        if (!Types.ObjectId.isValid(id)) {
            sendErrorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                'Invalid Order ID format',
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
        try {
            const result = await this.service.delete(id, req.user!.id);
            if (result) {
                if (req?.user?.userType === 'User') {
                    await logUserActivity(new Types.ObjectId(userId), req, req.user.email, 'Order Status Updated');
                }
            }
            sendResponse(res, result);
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
    updateOrderStatus = async (req: Request, res: Response): Promise<any> => {
        try {

            const queryResult = updateOrderStatusSchema.safeParse(req.body);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res, StatusCodes.BAD_REQUEST,
                    'Invalid body parameters', 'Invalid body parameters',
                    queryResult.error.errors);
            }
            const result = await this.service.updateOrderStatus(queryResult.data.orderId, queryResult.data?.status ?? '', queryResult.data.userId);
            res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    getReturnExchangeList = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id ?? '';
            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 100;
            const type = req.query.type as string || 'wholesaler';
            const status = req.query.status as string || '';
            const dateFilter = req.query.dateFilter as string ?? undefined;
            const startDate = req.query.startDate as string ?? undefined;
            const endDate = req.query.endDate as string ?? undefined;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.service.getReturnExchangeList({ page, limit, type, userId, status, dateFilter, startDate, endDate, });

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

export function ReturnOrderHandlerFun(service: ReturnOrderDomainService): ReturnOrderHandler {
    return new ReturnOrderHandler(service);
}