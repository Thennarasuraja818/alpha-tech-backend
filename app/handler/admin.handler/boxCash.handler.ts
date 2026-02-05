// app/handler/admin.handler/boxCash.handler.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BoxCashServiceDomain } from "../../../domain/admin/boxCashDomain";
import { createBoxCashSchema } from "../../../api/Request/boxCash";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { BoxCashParams } from "../../../domain/admin/boxCashDomain";
import { parseTwoDigitYear } from "moment";

export class BoxCashHandler {
  constructor(private service: BoxCashServiceDomain) { }

  createTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
      const pared = req.body
      console.log(pared, "ppppppppppp");

      const validation = createBoxCashSchema.safeParse(req.body);

      if (!validation.success) {
        sendErrorResponse(res, StatusCodes.BAD_REQUEST, "Validation error", 'VALIDATION_ERROR', validation.error.errors);
        return;
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

      const result = await this.service.createTransaction(validation.data, userId);

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
      const params: BoxCashParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || '',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        transactionType: req.query.transactionType as string,
        userType: req.query.userType as string,
      };

      const result = await this.service.getAllTransactions(params);

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
      const validation = createBoxCashSchema.safeParse(req.body);

      if (!validation.success) {
        sendErrorResponse(res, StatusCodes.BAD_REQUEST, "Validation error", 'VALIDATION_ERROR', validation.error.errors);
        return;
      }

      const userId = req.user?.id as any;

      if (!userId) {
        sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
          'UNAUTHORIZED'
        );
        return;
      }

      const result = await this.service.updateTransaction(id, validation.data, userId);

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
      const params: BoxCashParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || '',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        transactionType: req.query.transactionType as string,
        userType: req.query.userType as string,
      };

      const result = await this.service.getDailySummary(params);

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

export function boxCashHandler(service: BoxCashServiceDomain): BoxCashHandler {
  return new BoxCashHandler(service);
}