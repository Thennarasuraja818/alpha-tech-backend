import { Request, Response } from 'express';
import { SubcategoryServiceDomain } from '../../../domain/website/subcategory.domain';
import {
  createSubcategorySchema,
  updateSubcategorySchema,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from '../../../api/Request/subcategory';
import { StatusCodes } from 'http-status-codes';

export class SubcategoryHandler {
  private service: SubcategoryServiceDomain;

  constructor(service: SubcategoryServiceDomain) {
    this.service = service;
  }

  getAllSubcategories = async (req: Request, res: Response): Promise<void> => {
    const categoryId = req.query.category as string | undefined;
    const limit = req.query.limit as number | undefined;
    const page = req.query.page as number | undefined;
    const result = await this.service.getAllSubcategories({ categoryId, limit, page });
    if (result.status === 'error') {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

  getSubcategoryById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const result = await this.service.getSubcategoryById(id);
    if (result.status === 'error') {
      res.status(StatusCodes.NOT_FOUND).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

}

export function SubcategoryHandlerFun(service: SubcategoryServiceDomain): SubcategoryHandler {
  return new SubcategoryHandler(service);
}
