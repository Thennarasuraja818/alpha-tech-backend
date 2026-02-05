import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createPettyCashManagementSchema,
  UpdatePettyCashManagementInput,
  updatePettyCashManagementSchema,
} from "../../../api/Request/pettyCashManagement";
import {
  sendErrorResponse,
  sendPaginationResponse,
  sendResponse,
} from "../../../utils/common/commonResponse";
import { PettyCashManagementParams, PettyCashManagementServiceDomain } from "../../../domain/admin/pettyCashManagementDomain";

export class PettyCashManagementHandler {
  constructor(private service: PettyCashManagementServiceDomain) { }

  createPettyCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const validation = createPettyCashManagementSchema.safeParse(req.body);

      if (!validation.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Validation error",
          "VALIDATION_ERROR",
          validation.error.errors
        );
      }

      const userId = req.user?.id;

      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          "User not authenticated",
          "UNAUTHORIZED"
        );
      }

      const result = await this.service.createPettyCashManagement(validation.data, userId);
      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };

  getPettyCashManagementById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.service.getPettyCashManagementById(id);
      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };

  getAllPettyCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const params: PettyCashManagementParams = {
        page: parseInt(req.query.page as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || "",
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const userId = req.user?.id;

      const result = await this.service.getAllPettyCashManagement(params, userId!);
      return sendPaginationResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };

  updatePettyCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      // Parse FormData if content-type is multipart/form-data
      let bodyData: any = req.body;

      // If denominations is a string (from FormData), parse it
      if (req.body.denominations && typeof req.body.denominations === 'string') {
        try {
          bodyData = {
            ...req.body,
            denominations: JSON.parse(req.body.denominations),
            isAdmin: JSON.parse(req.body.isAdmin)
          };
        } catch (parseError) {
          return sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            "Invalid denominations format",
            "VALIDATION_ERROR"
          );
        }
      }

      const validation = updatePettyCashManagementSchema.safeParse(bodyData);

      if (!validation.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Validation error",
          "VALIDATION_ERROR",
          validation.error.errors
        );
      }

      const data: UpdatePettyCashManagementInput = validation.data;
      const userId = req.user?.id;

      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          "User not authenticated",
          "UNAUTHORIZED"
        );
      }

      const result = await this.service.updatePettyCashManagement(id, data, userId);
      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };

  updatePettyCashManagementForAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      // Parse FormData if content-type is multipart/form-data
      let bodyData: any = req.body;

      // If denominations is a string (from FormData), parse it
      if (req.body.denominations && typeof req.body.denominations === 'string') {
        try {
          bodyData = {
            ...req.body,
            denominations: JSON.parse(req.body.denominations)
          };
        } catch (parseError) {
          return sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            "Invalid denominations format",
            "VALIDATION_ERROR"
          );
        }
      }

      const validation = updatePettyCashManagementSchema.safeParse(bodyData);

      if (!validation.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Validation error",
          "VALIDATION_ERROR",
          validation.error.errors
        );
      }

      const data: UpdatePettyCashManagementInput = validation.data;
      const userId = req.user?.id;

      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          "User not authenticated",
          "UNAUTHORIZED"
        );
      }

      const result = await this.service.updatePettyCashManagementForAdmin(id, data, userId);
      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };


  deletePettyCashManagement = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.service.deletePettyCashManagement(id);
      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };

  getDailyPettyCashManagementSummary = async (req: Request, res: Response): Promise<any> => {
    try {
      const params: PettyCashManagementParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string || "",
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await this.service.getDailyPettyCashManagementSummary(params);
      return sendPaginationResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      );
    }
  };
}

export function pettyCashManagementHandler(service: PettyCashManagementServiceDomain): PettyCashManagementHandler {
  return new PettyCashManagementHandler(service);
}
