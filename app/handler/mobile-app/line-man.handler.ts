import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createVisitSchema, CreateVisitTracker } from "../../../api/Request/visitrackerReq";
import { LineManServiceDomain } from "../../../domain/mobile-app/line-manDomain";
import { Types } from "mongoose";
import { logAdminUserActivity } from "../../../utils/utilsFunctions/admin.users.activity";
import { ReceivePaymentInput, receivePaymentSchema } from "../../../api/Request/receivePayment";
import { ReceiveCashSettlementInput, receiveCashSettlementSchema } from "../../../api/Request/cashsettle";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { userListQuerySchema } from "../../../api/Request/user";
import { ShopTypeListQuerySchema } from "../../../api/Request/shop.type";

export class LineManHandler {
    private userService: LineManServiceDomain;

    constructor(userService: LineManServiceDomain) {
        this.userService = userService;
    }

    createVisitTracker = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = createVisitSchema.safeParse(req.body);
            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }

            const userId = req.user.id;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User Id required' });
            }
            const data: CreateVisitTracker = parsed.data;
            data.userId = userId;
            const result = await this.userService.createVisitTracker(data);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            console.log(req.user.email, 'req.user.email');

            // Insert User Activity
            await logAdminUserActivity(userId, req, req.user.email, 'Created Wholesaler visit tracker');
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };
    createReceivePayment = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = receivePaymentSchema.safeParse(req.body);
            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }

            const userId = req.user.id;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User Id required' });
            }
            const data: ReceivePaymentInput = parsed.data;
            data.createdBy = userId;
            const result = await this.userService.receivePayment(data);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            // Insert User Activity
            await logAdminUserActivity(userId, req, req.user.email, 'Create Payment Receive');
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };
    getReceivePayment = async (req: Request, res: Response): Promise<any> => {
        try {

            const userId = req.user.id;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User Id required' });
            }

            const result = await this.userService.getPaymentModeSummaryForToday(userId);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };
    createCashSettlement = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = receiveCashSettlementSchema.safeParse(req.body);
            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }

            const userId = req.user.id;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User Id required' });
            }
            const data: ReceiveCashSettlementInput = parsed.data;
            data.settledBy = userId;
            const result = await this.userService.settleCash(data);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            // Insert User Activity
            await logAdminUserActivity(userId, req, req.user.email, "Cash settlement submitted");
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };
    getCashSettlementList = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const filterType = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.userService.getCashSettlementList({ userId, limit, page, status, filterType, startDate, endDate });
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
    getAllUsers = async (req: Request, res: Response): Promise<any> => {
        try {
            const queryResult = userListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY',
                    queryResult.error.errors
                );
            }
            const users = await this.userService.getAllUsers(queryResult.data);

            // const users = await this.userService.getAllUsers();
            res.status(StatusCodes.OK).json(users);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    getPaymentList = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.getPaymentList({ userId, limit, page, status, dateFilter, startDate, endDate, search });
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
    getSalesTargetVsAchievementList = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.getSalesTargetVsAchievementList({ userId, limit, page, status, dateFilter, startDate, endDate, search });
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
    getSalesConversionReport = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.getSalesConversionReport({ userId, limit, page, status, dateFilter, startDate, endDate, search });
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
    getCustomerActivity = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const filterType = req.query.filterType ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.getCustomerActivity({ userId, limit, page, status, filterType, startDate, endDate, search });
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
    getOrderSummary = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const filterType = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.getOrderSummary({ userId, limit, page, status, filterType, startDate, endDate, search });
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
    inactiveCustomer = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.inactiveCustomer({ userId, limit, page, status, dateFilter, startDate, endDate, search });
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
    getVisitTrackerReport = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const limit = parseInt(req.query.limit as string) || 100;
            const page = parseInt(req.query.page as string) || 0;
            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result: any = await this.userService.getVisitTrackerReport({ userId, limit, page, status, filterType: dateFilter, startDate, endDate, search });
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
    getOutstandingPayments = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const dateFilter = req.query.dateFilter ?? undefined;


            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.userService.getOutstandingPayments({ userId, dateFilter });
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
    getSalesPerformanceByUser = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const dateFilter = req.query.dateFilter ?? undefined;

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.userService.getSalesPerformanceByUser({ userId, dateFilter });
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
    getPaymentDueList = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const placedBy = req.query.placedBy ?? undefined;
            const type = req.query.type ?? 'lineman';

            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.userService.getPaymentDueList({ userId, dateFilter, placedBy, type });
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
    getSalesTargetAchievement = async (req: Request, res: Response): Promise<any> => {
        try {
            const userId = req.user.id as string ?? undefined;
            const month = req.query.month ?? undefined;
            const year = req.query.year ?? undefined;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User Id required',
                    'User Id required'
                );
            }
            const result = await this.userService.getSalesTargetAchievement({ userId, year, month });
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
    getAllShopType = async (req: any, res: any): Promise<any> => {
        try {

            const queryResult = ShopTypeListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res, StatusCodes.BAD_REQUEST,
                    'Invalid query parameters', 'INVALID_QUERY_PARAMS',
                    queryResult.error.errors);
            }

            const { page, limit, search } = queryResult.data;

            const result = await this.userService.getShopTypeList({
                page: Number(page),
                limit: Number(limit),
                search: String(search),
            });
            res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

}

export function LineManHandlerFun(service: LineManServiceDomain): LineManHandler {
    return new LineManHandler(service);
}
