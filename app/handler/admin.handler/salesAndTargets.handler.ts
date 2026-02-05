import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { createSalesTargetSchema, updateCashsettlmentStatusSchema, updateSalesTargetSchema } from '../../../api/Request/salesAndTargets';
import { SalesTargetListParams } from '../../../domain/admin/salesAndTargetsDomain';
import { sendErrorResponse, sendPaginationResponse } from '../../../utils/common/commonResponse';
import { Types } from 'mongoose';
import { SalesTargetDomainService } from '../../../domain/admin/salesAndTargetsDomain';
export class SalesTargetHandler {
  service: SalesTargetDomainService
  constructor(service: SalesTargetDomainService) {
    this.service = service
  }

  createSalesTarget = async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'Unauthorized',
          'UNAUTHORIZED'
        );
      }

      const result = createSalesTargetSchema.safeParse(req.body);
      if (!result.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Validation error',
          'VALIDATION_ERROR',
          result.error.errors
        );
      }

      const response = await this.service.createSalesTarget(result.data, userId);
      res.status(StatusCodes.CREATED).json(response);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };

  updateSalesTarget = async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'Unauthorized',
          'UNAUTHORIZED'
        );
      }

      const { id } = req.params as any;
      if (!id || !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid sales target ID',
          'INVALID_ID'
        );
      }

      const result = updateSalesTargetSchema.safeParse(req.body);
      if (!result.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Validation error',
          'VALIDATION_ERROR',
          result.error.errors
        );
      }

      const response = await this.service.updateSalesTarget(id, result.data, userId);
      res.status(StatusCodes.OK).json(response);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };

  getSalesTarget = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      if (!id || !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid sales target ID',
          'INVALID_ID'
        );
      }

      const result = await this.service.getSalesTargetById(id);
      if (!result) {
        return sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          'Sales target not found',
          'NOT_FOUND'
        );
      }

      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };

  listSalesTargets = async (req: Request, res: Response): Promise<any> => {
    try {
      const {
        page,
        limit,
        search,
        status,
        targetPeriod,
        salemanId
      } = req.query;

      const params: SalesTargetListParams = {
        page: parseInt(page as string, 10) || 0,
        limit: parseInt(limit as string, 10) || 10,
        search: search as string,
        status: status as string,
        targetPeriod: targetPeriod as 'Monthly' | 'Quarterly' | 'Yearly',
        salemanId: salemanId as string
      };

      const result = await this.service.listSalesTargets(params);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };

  deleteSalesTarget = async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'Unauthorized',
          'UNAUTHORIZED'
        );
      }

      const { id } = req.params as any;
      if (!id || !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid sales target ID',
          'INVALID_ID'
        );
      }

      const result = await this.service.deleteSalesTarget(id, userId);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };
  salesPerformance = async (req: Request, res: Response): Promise<any> => {
    try {

      const limit = parseInt(req.query.limit as string) || 100;
      const page = parseInt(req.query.page as string) || 0;
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
      const status = req.query.status as string || undefined;
      const salemanId = req.query.salemanId as string || undefined;
      const targetPeriod = req.query.targetPeriod as string || undefined;

      const result = await this.service.salesPerformanceList({
        page: +page,
        limit: +limit,
        search: search,
        salemanId,
        targetPeriod,
        status
      });
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
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
      const result = await this.service.getCashSettlementList({ userId, limit, page, status, filterType, startDate, endDate });
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
  updatCashSettlementStatus = async (req: Request, res: Response): Promise<any> => {
    try {

      console.log(req.user, 'req.user');

      const userId = req.user?.id;
      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'Unauthorized',
          'UNAUTHORIZED'
        );
      }

      const { id } = req.params as any;
      if (!id || !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid cash settlement Id',
          'INVALID_ID'
        );
      }

      const result = updateCashsettlmentStatusSchema.safeParse(req.body);
      if (!result.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Validation error',
          'VALIDATION_ERROR',
          result.error.errors
        );
      }

      const response = await this.service.updateCashsettlementStatus(id, result.data, userId);
      res.status(StatusCodes.OK).json(response);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };
  listAchievedSalesTargets = async (req: Request, res: Response): Promise<any> => {
    try {
      const {
        page,
        limit,
        search,
      } = req.query;

      const params: SalesTargetListParams = {
        page: parseInt(page as string, 10) || 0,
        limit: parseInt(limit as string, 10) || 100,
        search: search as string,
      };

      const result = await this.service.listAchievedSalesTargets(params);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };
  listNewAddedWholeSalerRetailer = async (req: Request, res: Response): Promise<any> => {
    try {
      const {
        page,
        limit,
        search,
      } = req.query;

      const params: SalesTargetListParams = {
        page: parseInt(page as string, 10) || 0,
        limit: parseInt(limit as string, 10) || 100,
        search: search as string,
      };

      const result = await this.service.listNewAddedWholeSalerRetailer(params);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Internal server error'
      });
    }
  };

}

export function NewSalesTargetHandler(service: SalesTargetDomainService): SalesTargetHandler {
  return new SalesTargetHandler(service)
}