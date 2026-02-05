import { Request, Response } from 'express';
import { ChildCategoryServiceDomain } from '../../../domain/admin/childCategoryDomain';
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

  createChildCategory = async (req: Request, res: Response): Promise<void> => {
    const files = (req.files as any)?.image;
    const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
    const payload = { ...req.body, images };
    const parsed = createChildCategorySchema.safeParse(payload);
    if (!parsed.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      return;
    }
    const data: CreateChildCategoryInput = parsed.data;
    const result = await this.service.createChildCategory(data);
    if (result.status === 'error') {
      res.status(StatusCodes.BAD_REQUEST).json(result);
      return;
    }
    res.status(StatusCodes.CREATED).json(result);
  };

  getAllChildCategoriesBySubcategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const result = await this.service.getAllChildCategoriesBySubcategory(id);
    if (result.status === 'error') {
      res.status(StatusCodes.NOT_FOUND).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

  getAllChildCategories = async (req: Request, res: Response): Promise<void> => {
    // parse pagination and filter params
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || 'displayOrder';
    const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
    const categoryId = (req.query.categoryId as string) || '';
    const subCategoryId = (req.query.subCategoryId as string) || '';

    const result = await this.service.getAllChildCategories({ limit, offset, search, sortBy, order, categoryId, subCategoryId });
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

  updateChildCategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const files = (req.files as any)?.image;
    const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
    const payload = { ...req.body, images };

    const parsed = updateChildCategorySchema.safeParse(payload);
    if (!parsed.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      return;
    }
    const data: UpdateChildCategoryInput = parsed.data;
    const result = await this.service.updateChildCategory(id, data);
    if (result.status === 'error') {
      const code = result.statusCode === StatusCodes.NOT_FOUND ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST;
      res.status(code).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

  deleteChildCategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const result = await this.service.deleteChildCategory(id);
    if (result.status === 'error') {
      const code = result.statusCode === StatusCodes.NOT_FOUND ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST;
      res.status(code).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };
}

export function ChildCategoryHandlerFun(service: ChildCategoryServiceDomain): ChildCategoryHandler {
  return new ChildCategoryHandler(service);
}
