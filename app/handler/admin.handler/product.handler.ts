import { Request, Response } from "express";
import { ProductDomainService } from "../../../domain/admin/productDomain";
import { StatusCodes } from "http-status-codes";
import { createProductSchema, productListQuerySchema, updateProductSchema } from "../../../api/Request/product";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";

class ProductHandler {
  private readonly productService: ProductDomainService;

  constructor(service: ProductDomainService) {
    this.productService = service;
  }

  getCurrentStock = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = await this.productService.getCurrentStock();
      if ('status' in result && result.status === 'error') {
        return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, result.message, 'INTERNAL_SERVER_ERROR');
      }
      return sendResponse(res, result);
    } catch (error) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get current stock',
        'INTERNAL_ERROR'
      );
    }
  };

  create = async (req: Request, res: Response): Promise<any> => {
    try {
      const productImg = req.files?.productImage
        ? Array.isArray(req.files.productImage)
          ? req.files.productImage
          : [req.files.productImage]
        : [];

      const productAdditionalImg = req.files?.additionalImages
        ? Array.isArray(req.files.additionalImages)
          ? req.files.additionalImages
          : [req.files.additionalImages]
        : [];
      const formFields: any = { ...req.body };
      if (formFields.customerAttribute) {
        try {
          formFields.customerAttribute = JSON.parse(formFields.customerAttribute);
        } catch {
          return sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            'Invalid customerAttribute JSON',
            'INVALID_INPUT'
          );
        }
      }

      if (formFields.wholesalerAttribute) {
        try {
          formFields.wholesalerAttribute = JSON.parse(formFields.wholesalerAttribute);
        } catch {
          return sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            'Invalid wholesalerAttribute JSON',
            'INVALID_INPUT'
          );
        }
      }

      const validationResult = createProductSchema.safeParse(formFields);

      if (!validationResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid request body',
          'INVALID_INPUT',
          validationResult.error.errors
        );
      }

      const productData = validationResult.data;

      const userId = req.user?.id;
      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
          'UNAUTHORIZED'
        );
      }

      const result = await this.productService.create(
        productData,
        userId,
        productImg,
        productAdditionalImg
      );

      return sendResponse(res, result);
    } catch (error) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };


  update = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;

      // 1️⃣ Validate ID
      if (!id || !Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid Product ID',
          'INVALID_PARAMS'
        );
      }

      const productImg = req.files?.productImage
        ? Array.isArray(req.files.productImage)
          ? req.files.productImage
          : [req.files.productImage]
        : [];

      const productAdditionalImg = req.files?.additionalImages
        ? Array.isArray(req.files.additionalImages)
          ? req.files.additionalImages
          : [req.files.additionalImages]
        : [];

      const formFields: any = { ...req.body };
      if (formFields.customerAttribute) {
        try {
          formFields.customerAttribute = JSON.parse(formFields.customerAttribute);
        } catch {
          return sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            'Invalid customerAttribute JSON',
            'INVALID_INPUT'
          );
        }
      }

      if (formFields.wholesalerAttribute) {
        try {
          formFields.wholesalerAttribute = JSON.parse(formFields.wholesalerAttribute);
        } catch {
          return sendErrorResponse(
            res,
            StatusCodes.BAD_REQUEST,
            'Invalid wholesalerAttribute JSON',
            'INVALID_INPUT'
          );
        }
      }

      const validationResult = updateProductSchema.safeParse({
        ...formFields,
        id,
      });

      if (!validationResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid request body',
          'INVALID_INPUT',
          validationResult.error.errors
        );
      }

      const updateData = validationResult.data;

      const userId = req.user?.id;
      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
          'UNAUTHORIZED'
        );
      }

      const result = await this.productService.update(
        id,
        updateData,
        userId,
        productImg,
        productAdditionalImg
      );

      return sendResponse(res, result);
    } catch (error) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  };


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
      const result = await this.productService.getById(id as string);

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

  getList = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = productListQuerySchema.safeParse(req.query);

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
      const { page, limit, search, sort, type, categoryId, offerType, stockType } = queryResult.data;

      const response = await this.productService.list({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        sort: sort === "desc" ? "desc" : "asc",
        type: type,
        categoryId: categoryId ?? '',
        userId: '',
        orderId: '',
        offerType: offerType ?? '',
        stockType: stockType ?? ''
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
  };
  getActiveList = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = productListQuerySchema.safeParse(req.query);

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
      const { page, limit, search, sort, type, categoryId, offerType, stockType, userId } = queryResult.data;

      const response = await this.productService.activeList({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        sort: sort === "desc" ? "desc" : "asc",
        type: type,
        categoryId: categoryId ?? '',
        userId: userId ?? '',
        orderId: '',
        offerType: offerType ?? '',
        stockType: stockType ?? ''
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
  };

  delete = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const userId = req.user?.id;

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

      if (!userId) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
          'UNAUTHORIZED'
        );
      }

      const response = await this.productService.delete(id, userId);
      return sendResponse(res, response);
    } catch (err: any) {
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
