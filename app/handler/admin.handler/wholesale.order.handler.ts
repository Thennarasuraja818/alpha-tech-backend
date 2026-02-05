import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { WholesaleOrderServiceDomain } from "../../../domain/admin/wholesaleOrderDomain";
import {
  CreateWholesaleOrderInput,
  createWholesaleOrderSchema,
  UpdateWholesaleOrderInput,
  updateWholesaleOrderSchema,
} from "../../../api/Request/wholesaleOrder";
import { sendErrorResponse, sendPaginationResponse, successResponse, sendResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { string } from "zod";
import { WholesaleOrderListQuery, WholesaleOrderListQueryParam } from "../../../api/Request/wholesalerRequest";

export class WholesaleOrderHandler {
  private userService: WholesaleOrderServiceDomain;

  constructor(userService: WholesaleOrderServiceDomain) {
    this.userService = userService;
  }

  createWholeSaleOrder = async (
    req: Request & { user: any },
    res: Response
  ): Promise<any> => {
    try {
      const parsed = createWholesaleOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: parsed.error.errors });
      }
      console.log(req.user, "userdata");
      const data: CreateWholesaleOrderInput = parsed.data;
      data.createdBy = req.user.id;
      data.modifiedBy = req.user.id;

      const result = await this.userService.createOrder(data);
      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      return res.status(StatusCodes.CREATED).json(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
  getAllWholeSaleOrder = async (req: Request, res: Response): Promise<any> => {
    // parse pagination and filter params
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || "displayOrder";
    const order = (req.query.order as string) === "desc" ? "desc" : "asc";
    const type = req.query.type as string || '';
    const result = await this.userService.getAllWholeSaleorders({
      limit,
      offset,
      search,
      sortBy,
      order,
      type
    });
    if (result.status === "error") {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
    }
    // result.data contains items, metadata
    return res.status(StatusCodes.OK).json(result);
  };

  getCategoryById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const result = await this.userService.getOrderById(id);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };

  updateCategory = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const parsed = updateWholesaleOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: parsed.error.errors });
    }
    const data: UpdateWholesaleOrderInput = parsed.data;
    const result = await this.userService.updateOrder(id, data);
    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };

  deleteCategory = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const result = await this.userService.deleteOrder(id);
    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  list = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 0;
      const type = req.query.type as string || undefined;
      const orderType = req.query.orderType as string || undefined;
      const Id = req.query.Id as string || undefined;
      const status = req.query.status as string || undefined;
      const orderCode = req.query.orderCode as string || undefined;
      const search = req.query.search as string || undefined;
      const createdById = req.user?.id;
      const format = req.query.format as string || undefined; // Add format parameter
      const date = req.query.date as string || undefined
      const result = await this.userService.orderlists({ page, limit, type, orderType, Id, status, orderCode, search, createdById, format, date });
      // Handle Excel format response
      if (format === 'excel' && 'filename' in result && 'data' in result) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
        return res.send(result.data);
      }

      // Handle normal pagination response
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
  deliveryList = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 0;
      const type = req.query.type as string || 'customer';
      const orderType = req.query.orderType as string || undefined;
      const Id = req.query.Id as string || undefined;
      const status = req.query.status as string || undefined;
      const result = await this.userService.deliveryList({ page, limit, type, orderType, Id, status });
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
  deliverymanPerformanceList = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const fromDate = req.query.fromDate as string || '';
      const toDate = req.query.toDate as string || '';
      const result = await this.userService.deliverymanPerformanceList({ page, limit, fromDate, toDate });
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
  deliverymanTopPerformanceList = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const fromDate = req.query.fromDate as string || '';
      const toDate = req.query.toDate as string || '';
      const result = await this.userService.deliverymanTopPerformanceList({ page, limit, fromDate, toDate });
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
  failedDeliveryList = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const fromDate = req.query.fromDate as string || '';
      const toDate = req.query.toDate as string || '';
      const result = await this.userService.failedDeliveryList({ page, limit, fromDate, toDate });
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
  }
  orderDetails = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const result = await this.userService.orderDetails(id);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  orderDetailsByInvoiceId = async (req: Request, res: Response): Promise<any> => {
    const { invoiceId } = req.params as any;
    const result = await this.userService.orderDetailsByInvoiceId(invoiceId);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  updateOrderPayment = async (req: Request, res: Response): Promise<any> => {
    try {
      const orderId = req.params.id as any;
      const { amountPaid, paymentMode } = req.body;
      if (!orderId) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'order ID is required',
          'INVALID_PARAMS'
        );
      }
      if (!Types.ObjectId.isValid(orderId)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'order ID format',
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
      if (!orderId || amountPaid == null || !paymentMode) {
        return sendErrorResponse(res, 400, 'Missing required fields', 'VALIDATION_ERROR');
      }

      const response = await this.userService.updatePayment({
        orderId,
        amountPaid,
        paymentMode,
        userId,
      });
      return sendResponse(res, response);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id, status } = req.params as any;
      const paymentStatus = req.body.paymentStatus;
      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'order ID is required',
          'INVALID_PARAMS'
        );
      }
      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'order ID format',
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

      const response = await this.userService.updateOrderStatus(id, status, userId, paymentStatus);

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
  findOrderOfWholesaler = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = WholesaleOrderListQuery.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY_PARAMS',
          queryResult.error.errors
        );
      }

      // Get validated and transformed query params
      const { page, limit, search, id } = queryResult.data;

      if (id && !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid wholesaler ID format',
          'INVALID_PARAMS'
        );
      }

      const response = await this.userService.findOrderOfWholesaler({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        id: id ?? '',
        type: ''
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

  findCreditDetails = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = WholesaleOrderListQuery.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY_PARAMS',
          queryResult.error.errors
        );
      }

      // Get validated and transformed query params
      const { page, limit, search, id, type } = queryResult.data;

      if (id && !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `Invalid ${type} ID format`,
          'INVALID_PARAMS'
        );
      }

      const response = await this.userService.findCreditDetails({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        id: id ?? '',
        type: type ?? ''
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
  returnOrderList = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 0;
      const type = req.query.type as string || 'customer';
      const orderType = req.query.orderType as string || undefined;
      const status = req.query.status as string || undefined;
      const result = await this.userService.returnOrderList({ page, limit, type, orderType, status });
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
  updateReturnOrderStatus = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const { status } = req.body;
      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'order ID is required',
          'INVALID_PARAMS'
        );
      }
      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'order ID format',
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

      const response = await this.userService.updateReturnOrderStatus(id, status, userId);

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
  findCreditOrderDetails = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = WholesaleOrderListQuery.safeParse(req.query);
      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY_PARAMS',
          queryResult.error.errors
        );
      }

      // Get validated and transformed query params
      const { page, limit, search, id, type } = queryResult.data;

      if (id && !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `Invalid ${type} ID format`,
          'INVALID_PARAMS'
        );
      }

      const response = await this.userService.findCreditOrderDetails({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        id: id ?? '',
        type: type ?? ''
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

  findCreditOrderDetailsForPaymentDue = async (req: Request, res: Response): Promise<any> => {
    try {
      console.log('poiouy');

      const queryResult = WholesaleOrderListQuery.safeParse(req.query);
      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY_PARAMS',
          queryResult.error.errors
        );
      }

      // Get validated and transformed query params
      const { page, limit, search, id, type } = queryResult.data;

      if (id && !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `Invalid ${type} ID format`,
          'INVALID_PARAMS'
        );
      }

      const response = await this.userService.findCreditOrderDetailsForPaymentDue({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        id: id ?? '',
        type: type ?? ''
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
  approvedUpdateStatus = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id, status, reason } = req.params as any;
      console.log(reason, "rrrr");

      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Order ID is required',
          'INVALID_PARAMS'
        );
      }
      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid order ID format',
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

      const response = await this.userService.approvedUpdateOrderStatus(id, status, userId, reason);

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
  topWholesalerOrder = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 0;
      const type = req.query.type as string || undefined;
      const orderType = req.query.orderType as string || undefined;
      const Id = req.query.Id as string || undefined;
      const status = req.query.status as string || undefined;
      const orderCode = req.query.orderCode as string || undefined;
      const placedByModel = req.query.placedByModel as string || undefined;
      const result = await this.userService.topWholesalerOrder({ page, limit, type, orderType, Id, status, orderCode, placedByModel });
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

export function WholesaleOrderHandlerFun(
  service: WholesaleOrderServiceDomain
): WholesaleOrderHandler {
  return new WholesaleOrderHandler(service);
}
