import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
    sendErrorResponse,
    sendResponse,
    sendPaginationResponse,
} from '../../../utils/common/commonResponse';
import { Types } from 'mongoose';
import { CreateOrderInput, createOrderSchema, UpdateOrderInput, updateOrderSchema, updateOrderStatusSchema } from '../../../api/Request/order';
import { logUserActivity } from '../../../utils/utilsFunctions/user.activity';
import { rootListQuerySchema } from '../../../api/Request/root';
import { CrmOrderDomainService } from '../../../domain/admin/crmOrderDomain';

class CrmOrderHandler {
    constructor(private service: CrmOrderDomainService) { }

    create = async (req: Request, res: Response): Promise<any> => {
        try {

            const parsed = createOrderSchema.safeParse(req.body);

            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }
            const data: CreateOrderInput = parsed.data;
            // data.placedBy = userId;
            const result = await this.service.create(data, req.user!.id);
            if (result) {
                // Insert User Activity
                if (data.placedByModel === 'User') {
                    await logUserActivity(new Types.ObjectId(data.placedBy), req, req.user.email, 'Order Placed');
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
            const type = req.query.type as string || 'crm';
            const orderStatus = req.query.orderStatus as string || '';
            const paymentStatus = req.query.paymentStatus as string || '';
            const orderCode = req.query.orderCode as string || undefined;
            const search = req.query.search ? String(req.query.search) : undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.service.list({ page, limit, type, userId, orderStatus, paymentStatus, orderCode, search });
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

    getById = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.params as any;
        if (!id || !Types.ObjectId.isValid(id)) {
            sendErrorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                'Order ID is required',
                'INVALID_PARAMS'
            );
        }
        if (!Types.ObjectId.isValid(id)) {
            sendErrorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                'Invalid Order ID format',
                'INVALID_PARAMS'
            );
        }
        try {
            const result = await this.service.getById(id);
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
            const data: UpdateOrderInput = parsed.data;
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

    updateStatus = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.params as any;
        const { amount, placedByModel } = req.body;
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

        if (!amount) {
            sendErrorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                'Amount is required',
                'INVALID_PARAMS'
            );
        }
        try {
            const result = await this.service.updateStatus(id, amount, req.user!.id);
            if (result) {
                if (placedByModel === 'User') {
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
    topSellingList = async (req: Request, res: Response): Promise<any> => {
        try {
            const type = req.query.type as string;
            const result = await this.service.topSellingProduct({ type });
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
    lineManOrderList = async (req: Request, res: Response): Promise<any> => {
        try {

            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 100;
            const type = req.query.type as string || 'wholesaler';
            const status = req.query.status as string || '';
            const userId = req.query.userId as string ?? undefined;
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
            const result = await this.service.lineManOrderList({ page, limit, type, userId, status, dateFilter, startDate, endDate });
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
    getAllRoot = async (req: Request, res: Response): Promise<any> => {
        try {

            const queryResult = rootListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res, StatusCodes.BAD_REQUEST,
                    'Invalid query parameters', 'INVALID_QUERY_PARAMS',
                    queryResult.error.errors);
            }

            const { page, limit, search, pincode } = queryResult.data;

            const result = await this.service.getRouteList({
                page: Number(page),
                limit: Number(limit),
                search: String(search),
                pincode: pincode ?? ''
            });
            res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
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
            const result = await this.service.updateOrderStatus(queryResult.data.orderId, queryResult.data?.status ?? '', queryResult.data.userId, queryResult.data.reason ?? '');
            res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    linemanlist = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.query.userId as string || '';
            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 0;
            const type = req.query.type as string || 'Wholesaler';
            const orderStatus = req.query.orderStatus as string || '';
            const paymentStatus = req.query.paymentStatus as string || '';
            const dateFilter = req.query.dateFilter as string ?? undefined;
            const startDate = req.query.startDate as string ?? undefined;
            const endDate = req.query.endDate as string ?? undefined;
            console.log(dateFilter, 'aaaaaaa');

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.service.list({ page, limit, type, userId, orderStatus, paymentStatus, dateFilter, startDate, endDate });
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

export function CrmOrderHandlerFun(service: CrmOrderDomainService): CrmOrderHandler {
    return new CrmOrderHandler(service);
}