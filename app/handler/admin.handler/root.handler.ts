import { StatusCodes } from "http-status-codes";
import { CreateRootInput, rootListQuerySchema, rootSchema, updateRootSchema } from "../../../api/Request/root";
import { RootDomainService } from "../../../domain/admin/root.Domain";
import { Request, Response } from "express";
import { sendErrorResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { CreateCustomerVariant, customervaraintRetailerSchema, customervaraintSchema, UpdateCustomerVariantRetailer } from "../../../api/Request/customer.variant";

class RootHandler {

  service: RootDomainService
  constructor(service: RootDomainService) {
    this.service = service
  }

  createRoot = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = rootSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;

      const rootInput: CreateRootInput = {
        ...result.data,
      };

      const response = await this.service.createRoute(rootInput, userId);
      res.status(response.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);

    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
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

  getRootById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Root ID is required',
          'INVALID_PARAMS'
        );
      }


      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Root ID format',
          'INVALID_PARAMS'
        );
      }

      const result = await this.service.getRouteById(id);
      ;
      if (!result) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "Root not found" });
      }

      res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  updateRoot = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = updateRootSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const rootData = {
        ...result.data,
      };

      const response = await this.service.updateRoue(rootData, userId);
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  deleteRoot = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Root ID is required',
          'INVALID_PARAMS'
        );
      }


      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Root ID format',
          'INVALID_PARAMS'
        );
      }
      const userId = req.user?.id;

      const response = await this.service.deleteRoot(id, userId);
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  createCustomerVariant = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = customervaraintSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;

      const rootInput: CreateCustomerVariant = req.body
      const response = await this.service.createCustomerVariant(rootInput, userId);
      res.status(response.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);

    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  customerVariantList = async (req: Request, res: Response): Promise<any> => {
    try {

      const response = await this.service.customerVariantList({});
      res.status(response.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);

    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  updateCustomerVariantForCustomer = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = customervaraintRetailerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;

      const rootInput: UpdateCustomerVariantRetailer = req.body
      const response = await this.service.updateCustomerVariantForCustomer(rootInput, userId);
      res.status(response.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);

    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
}

export function NewRootHandlerRegister(service: RootDomainService): RootHandler {
  return new RootHandler(service)
}