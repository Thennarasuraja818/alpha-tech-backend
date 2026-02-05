import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BoxCashManagementServiceDomain } from "../../../domain/admin/boxCashManagementDomain";
import { createBoxCashManagementSchema } from "../../../api/Request/boxCashManagement";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { BoxCashManagementParams } from "../../../domain/admin/boxCashManagementDomain";

export class BoxCashManagementHandler {
  constructor(private service: BoxCashManagementServiceDomain) { }

  createBoxCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const validation = createBoxCashManagementSchema.safeParse(req.body);

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

      const result = await this.service.createBoxCashManagement(validation.data, userId);

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

  getBoxCashManagementById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.service.getBoxCashManagementById(id);

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

  getAllBoxCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const params: BoxCashManagementParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || '',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await this.service.getAllBoxCashManagement(params);

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

  updateBoxCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const validation = createBoxCashManagementSchema.partial().safeParse(req.body);

      if (!validation.success) {
        sendErrorResponse(res, StatusCodes.BAD_REQUEST, "Validation error", 'VALIDATION_ERROR', validation.error.errors);
        return;
      }

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

      const result = await this.service.updateBoxCashManagement(id, validation.data, userId);

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

  deleteBoxCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.service.deleteBoxCashManagement(id);

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

  getBoxCashManagementByDate = async (req: Request, res: Response): Promise<any> => {
    try {
      const { date } = req.params as any;
      const result = await this.service.getBoxCashManagementByDate(date);

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
}

export function boxCashManagementHandler(service: BoxCashManagementServiceDomain): BoxCashManagementHandler {
  return new BoxCashManagementHandler(service);
}