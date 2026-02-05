import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import moment from "moment";
import { PettyCashServiceDomain } from "../../../domain/admin/pettyCashDomain";
import { createPettyCashSchema, UpdatePettyCashInput } from "../../../api/Request/pettyCash";
import { sendErrorResponse, sendPaginationResponse, sendResponse, successResponse } from "../../../utils/common/commonResponse";
import { PettyCashParams } from "../../../domain/admin/pettyCashDomain";

export class PettyCashHandler {
  constructor(private service: PettyCashServiceDomain) { }

  createTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
      const files = (req.files as any)?.documents;
      const documents = files ? (Array.isArray(files) ? files : [files]) : undefined;
      const payload = { ...req.body, documents };
      const userId = req.user?.id;

      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
          'UNAUTHORIZED'
        );
      }

      const result = await this.service.createTransaction(payload, userId);

      return sendResponse(res, result);

    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };

  getTransactionById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.service.getTransactionById(id);

      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };

  getAllTransactions = async (req: Request, res: Response): Promise<any> => {
    try {
      const params: PettyCashParams = {
        page: parseInt(req.query.page as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || '',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        transactionType: req.query.transactionType as string,
        paymentMode: req.query.paymentMode as string,
      };
      const userId = req.user?.id;
      const result = await this.service.getAllTransactions(params, userId);

      return sendPaginationResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };

  updateTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const files = (req.files as any)?.documents;
      const documents = files ? (Array.isArray(files) ? files : [files]) : undefined;
      const validation = createPettyCashSchema.partial().safeParse(req.body);

      if (!validation.success) {
        sendErrorResponse(res, StatusCodes.BAD_REQUEST, "Validation error", 'VALIDATION_ERROR', validation.error.errors);
        return;
      }

      const data: UpdatePettyCashInput = validation.data;
      const payload = { ...data, documents };
      const userId = req.user?.id;

      if (!userId) {
        sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
          'UNAUTHORIZED'
        );
        return;
      }
      const result = await this.service.updateTransaction(id, payload, userId);

      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };

  deleteTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.service.deleteTransaction(id);

      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };

  getDailySummary = async (req: Request, res: Response): Promise<any> => {
    try {
      const params: PettyCashParams = {
        page: parseInt(req.query.page as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || '',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        transactionType: req.query.transactionType as string,
        paymentMode: req.query.paymentMode as string,
      };
      const userId = req.user?.id;

      const result = await this.service.getAllTransactions(params, userId);

      return sendPaginationResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };
}

export function pettyCashHandler(service: PettyCashServiceDomain): PettyCashHandler {
  return new PettyCashHandler(service);
}
