import { Request, Response } from "express";
import { VendorpurchaseServiceDomain } from "../../../domain/admin/purchaseDomain";

import { StatusCodes } from "http-status-codes";
import { CreatePurchaseInput, createPurchaseSchema, UpdatePurchaseInput, updatePurchaseSchema } from "../../../api/Request/purchase";
import { sendErrorResponse, sendPaginationResponse } from "../../../utils/common/commonResponse";
import { vendorListQuerySchema, vendorPaymentQuerySchema, VendorPayments } from "../../../api/Request/vendor";
export class VendorPurchaseHandler {
  private service: VendorpurchaseServiceDomain;

  constructor(service: VendorpurchaseServiceDomain) {
    this.service = service;
  }

  createPurchase = async (req: Request, res: Response): Promise<any> => {
    const payload = req.body;
    const parsed = createPurchaseSchema.safeParse(payload);

    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: parsed.error.errors });
    }
    const userId = req.user.id;
    if (!userId) {
      return sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        'User not authenticated',
        'UNAUTHORIZED'
      );
    }

    const data: CreatePurchaseInput = parsed.data;
    data.createdBy = userId;
    data.modifiedBy = userId;
    const result = await this.service.createVendorpurchase(data);
    if (result.status === "error") {
      return res.status(StatusCodes.BAD_REQUEST).json(result);
    }
    res.status(StatusCodes.CREATED).json(result);
  };

  getAllPurchases = async (req: Request, res: Response): Promise<any> => {
    // parse pagination and filter params
    const limit = parseInt(req.query.limit as string) || 100;
    const page = parseInt(req.query.page as string) || 0;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || 'displayOrder';
    const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
    const result = await this.service.getAllVendorpurchases({ limit, page, search, sortBy, order });
    if (result.status === "error") {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
    }
    // result.data contains items, metadata
    return res.status(StatusCodes.OK).json(result);
  };

  getPurchaseById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const result = await this.service.getVendorpurchaseById(id);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };

  updatePurchase = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    console.log("updatePurchase called with id:", id);

    const payload = req.body;
    console.log("Payload received for update:", payload);

    // Transform empty strings to null before validation
    if (payload.vendorId === '') {
      payload.vendorId = null;
    }

    const parsed = updatePurchaseSchema.safeParse(payload);
    console.log("Parsed result:", parsed);

    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({
          message: "Validation error",
          errors: parsed.error.errors
        });
    }

    const userId = req.user.id;
    console.log("User ID from request:", userId);

    if (!userId) {
      return sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        'User not authenticated',
        'UNAUTHORIZED'
      );
    }

    const data: UpdatePurchaseInput = {
      ...parsed.data,
      modifiedBy: userId
    };

    const result = await this.service.updateVendorpurchase(id, data);

    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }

    res.status(StatusCodes.OK).json(result);
  };

  deletePurchase = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const userId = req.user.id;
    if (!userId) {
      return sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        'User not authenticated',
        'UNAUTHORIZED'
      );
    }
    const result = await this.service.deleteVendorpurchase(id, userId);
    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  getVendorPurchaseList = async (req: Request, res: Response): Promise<any> => {
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

      const response = await this.service.getVendorPaymentList(queryResult.data);

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
  updatePayment = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const userId = req.user.id;
    if (!userId) {
      return sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        'User not authenticated',
        'UNAUTHORIZED'
      );
    }
    const payload = req.body;

    const parsed = vendorPaymentQuerySchema.safeParse(payload);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: parsed.error.errors });
    }
    const data: VendorPayments = parsed.data;
    data.modifiedBy = userId;
    const result = await this.service.updatePayment(id, data);
    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  getVendorPaymentDues = async (req: Request, res: Response): Promise<any> => {
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

      const response = await this.service.getVendorPaymentDues(queryResult.data);

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

export function PurchaseHandlerFun(
  service: VendorpurchaseServiceDomain
): VendorPurchaseHandler {
  return new VendorPurchaseHandler(service);
}
