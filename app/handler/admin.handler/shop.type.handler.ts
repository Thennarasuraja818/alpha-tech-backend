import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { sendErrorResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { ShopTypeDomainService } from "../../../domain/admin/shop.typeDomain";
import { CreateShopTypeInput, ShopTypeListQuerySchema, shopTypeSchema, UpdateShopTypeInput, updateShoptypeSchema } from "../../../api/Request/shop.type";

class ShoptypeHandler {

  service: ShopTypeDomainService
  constructor(service: ShopTypeDomainService) {
    this.service = service
  }

  createShopType = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = shopTypeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const rootInput: CreateShopTypeInput = req.body;
      const response = await this.service.createShopeType(rootInput, userId);
      res.status(response.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);

    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getAllShopType = async (req: Request, res: Response): Promise<any> => {
    try {

      const queryResult = ShopTypeListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res, StatusCodes.BAD_REQUEST,
          'Invalid query parameters', 'INVALID_QUERY_PARAMS',
          queryResult.error.errors);
      }

      const { page, limit, search } = queryResult.data;

      const result = await this.service.getShopTypeList({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getShoptypeById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Shop type ID is required',
          'INVALID_PARAMS'
        );
      }


      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Shop type ID format',
          'INVALID_PARAMS'
        );
      }

      const result = await this.service.getShoptypeById(id);
      res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  updateShoptype = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = updateShoptypeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }
      console.log(req.params?.id, 'req.params?.id');

      const userId = req.user?.id;
      const id = req.params?.id;
      const rootData: any = req.body;
      rootData.id = id

      const response = await this.service.updateShoptype(rootData, userId);
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  deleteShopType = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Shop type ID is required',
          'INVALID_PARAMS'
        );
      }


      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Shop type ID format',
          'INVALID_PARAMS'
        );
      }
      const userId = req.user?.id;

      const response = await this.service.deleteShopType(id, userId);
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

}

export function NewShoptypeHandlerRegister(service: ShopTypeDomainService): ShoptypeHandler {
  return new ShoptypeHandler(service)
}