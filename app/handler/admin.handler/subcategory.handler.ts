import { Request, Response } from 'express';
import { SubcategoryServiceDomain } from '../../../domain/admin/subcategoryDomain';
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

  createSubcategory = async (req: Request, res: Response): Promise<void> => {
    const files = (req.files as any)?.image;
    const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
    const payload = { ...req.body, images };
    const parsed = createSubcategorySchema.safeParse(payload);
    if (!parsed.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      return;
    }
    const data: CreateSubcategoryInput = parsed.data;
    const result = await this.service.createSubcategory(data);
    if (result.status === 'error') {
      res.status(StatusCodes.BAD_REQUEST).json(result);
      return;
    }
    res.status(StatusCodes.CREATED).json(result);
  };

  getAllSubcategories = async (req: Request, res: Response): Promise<void> => {
    const {
      category: categoryId,
      limit,
      offset,
      search,
      sortBy,
      order
    } = req.query;

    const result = await this.service.getAllSubcategories({
      categoryId: categoryId as string | undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search: search as string | undefined,
      sortBy: sortBy as string | undefined,
      order: order as 'asc' | 'desc' | undefined
    });

    if (result.status === 'error') {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

  getAllSubcategoriesByCategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const result = await this.service.getAllSubcategoriesByCategory(id);
    if (result.status === 'error') {
      res.status(StatusCodes.NOT_FOUND).json(result);
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

  updateSubcategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const files = (req.files as any)?.image;
    const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
    const payload = { ...req.body, images };
    const parsed = updateSubcategorySchema.safeParse(payload);
    if (!parsed.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      return;
    }
    const data: UpdateSubcategoryInput = parsed.data;
    const result = await this.service.updateSubcategory(id, data);
    if (result.status === 'error') {
      const code = result.statusCode === StatusCodes.NOT_FOUND ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST;
      res.status(code).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };

  deleteSubcategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as any;
    const result = await this.service.deleteSubcategory(id);
    if (result.status === 'error') {
      const code = result.statusCode === StatusCodes.NOT_FOUND ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST;
      res.status(code).json(result);
      return;
    }
    res.status(StatusCodes.OK).json(result);
  };
}

export function SubcategoryHandlerFun(service: SubcategoryServiceDomain): SubcategoryHandler {
  return new SubcategoryHandler(service);
}
