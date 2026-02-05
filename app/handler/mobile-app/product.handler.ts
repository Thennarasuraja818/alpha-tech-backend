import { Request, Response } from "express";
// import { ProductDomainService } from "../../../domain/admin/productDomain";
import { ProductDomainService } from "../../../domain/mobile-app/productDomain";
import { StatusCodes } from "http-status-codes";
import { mobileProductListQuerySchema } from "../../../api/Request/product";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";

class ProductHandler {
  private readonly productService: ProductDomainService;

  constructor(service: ProductDomainService) {
    this.productService = service;
  }


  getById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Brand ID is required',
          'INVALID_PARAMS'
        );
      }

      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Brand ID format',
          'INVALID_PARAMS'
        );
      }
      const result = await this.productService.getById(id);

      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }
  getProductByCategoryId = async (req: Request, res: Response): Promise<any> => {
    console.log("enter here ")
    try {
      const { id } = req.params as any;
      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Brand ID is required',
          'INVALID_PARAMS'
        );
      }

      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Brand ID format',
          'INVALID_PARAMS'
        );
      }
      const result = await this.productService.getProductByCategoryId(id);

      return sendResponse(res, result);
    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

  getList = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = mobileProductListQuerySchema.safeParse(req.query);
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

      const { childCategoryId, offset, limit, search, sortBy, order, categoryId, subCategoryId, page,
        type, id, priceFromRange, priceToRange, orderId, userId, orderType,
        ratingFrom, ratingTo } = queryResult.data;


      const response = await this.productService.list({
        offset: Number(offset),
        limit: Number(limit),
        search: search,
        order: order === "desc" ? "desc" : "asc",
        categoryId: categoryId ?? "",
        subCategoryId: subCategoryId ?? "",
        sortBy: sortBy ?? '',
        page: Number(page) ?? 0,
        type: type,
        id: id ?? '',
        priceFromRange: priceFromRange ?? '',
        priceToRange: priceToRange,
        orderId: orderId ?? '',
        userId: userId ?? '',
        fromDate: '',
        toDate: '',
        orderType: orderType ?? "",
        childCategoryId: childCategoryId ?? '',
        ratingFrom,
        ratingTo
      });

      return sendPaginationResponse(res, response);

    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

  getTopRated = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = mobileProductListQuerySchema.safeParse(req.query);
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

      const { type, limit, page, fromDate, toDate, orderType, ratingFrom, ratingTo } = queryResult.data;


      const response = await this.productService.findTopRatedProduct({
        offset: 0,
        limit: Number(limit),
        search: '',
        order: 'asc',
        categoryId: '',
        subCategoryId: '',
        sortBy: '',
        page: Number(page) ?? 0,
        type: type ?? "",
        id: '',
        priceFromRange: '',
        priceToRange: '',
        orderId: '',
        userId: '',
        fromDate: fromDate ?? "",
        toDate: toDate ?? "",
        orderType: orderType ?? '',
        childCategoryId: '',
        ratingFrom,
        ratingTo
      });

      return sendPaginationResponse(res, response);

    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }
}

export function NewProductHandlerRegister(
  service: ProductDomainService
): ProductHandler {
  return new ProductHandler(service);
}
