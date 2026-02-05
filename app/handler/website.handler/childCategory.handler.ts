import { Request, Response } from 'express';
import { ChildCategoryServiceDomain } from '../../../domain/website/childCategory.domain';
import {
  createChildCategorySchema,
  updateChildCategorySchema,
  CreateChildCategoryInput,
  UpdateChildCategoryInput,
} from '../../../api/Request/childCategory';
import { StatusCodes } from 'http-status-codes';

export class ChildCategoryHandler {
  private service: ChildCategoryServiceDomain;

  constructor(service: ChildCategoryServiceDomain) {
    this.service = service;
  }

  getAllChildCategories = async (req: Request, res: Response): Promise<void> => {
    const subcategoryId = req.query.subCategoryId as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || 'displayOrder';
    const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
    const result = await this.service.getAllChildCategories({ categoryId, subcategoryId, limit, offset, search, sortBy, order });
    if (result.status === 'error') {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

  getChildCategoryById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const result = await this.service.getChildCategoryById(id);
    if (result.status === 'error') {
      res.status(StatusCodes.NOT_FOUND).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

}

export function ChildCategoryHandlerFun(service: ChildCategoryServiceDomain): ChildCategoryHandler {
  return new ChildCategoryHandler(service);
}
