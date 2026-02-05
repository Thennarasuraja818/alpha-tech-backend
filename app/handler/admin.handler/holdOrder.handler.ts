import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
    sendErrorResponse,
    sendResponse,
    sendPaginationResponse,
} from '../../../utils/common/commonResponse';
import { Types } from 'mongoose';
import { logUserActivity } from '../../../utils/utilsFunctions/user.activity';
import { HoldOrderDomainService } from '../../../domain/admin/holdOrder.domain';

class HoldOrderHandler {
    constructor(private service: HoldOrderDomainService) { }

    create = async (req: Request, res: Response): Promise<any> => {
        try {
            console.log("req:", req.body)
            // const parsed = createOrderSchema.safeParse(req.body);

            // if (!parsed.success) {
            //     return res
            //         .status(StatusCodes.BAD_REQUEST)
            //         .json({ errors: parsed.error.errors });
            // }
            const data: any = req.body;
            console.log({ data })
            const result = await this.service.create(data, req.user!.id);
            if (result) {
                if (data.placedByModel === 'User') {
                    await logUserActivity(new Types.ObjectId(data.placedBy), req, req.user.email, 'Hold added');
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
            const limit = parseInt(req.query.limit as string) || 100;
            const type = req.query.type as string || 'wholesaler';
            const orderStatus = req.query.orderStatus as string || '';
            const paymentStatus = req.query.paymentStatus as string || '';
            const holdOrderId = req.query.holdOrderId as string || undefined;
            const orderFrom = req.query.orderFrom as string || '';
            console.log('ooo');

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }

            const result = await this.service.list({ page, limit, type, userId, orderStatus, paymentStatus, holdOrderId, orderFrom });
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

            // const parsed = updateOrderSchema.safeParse(req.body);
            // if (!parsed.success) {
            //     return res
            //         .status(StatusCodes.BAD_REQUEST)
            //         .json({ errors: parsed.error.errors });
            // }
            // const data: any = req.body;
            const result = await this.service.update(id, req.user!.id);

            if (result) {
                await logUserActivity(new Types.ObjectId(userId), req, req.user.email, 'Hold Order Deleted');
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

}

export function HoldOrderHandlerFun(service: HoldOrderDomainService): HoldOrderHandler {
    return new HoldOrderHandler(service);
}