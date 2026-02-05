import { Request, Response } from "express";
import { CategoryServiceDomain } from "../../../domain/admin/categoryDomain";
import {
  createCategorySchema,
  updateCategorySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../../api/Request/category";
import { StatusCodes } from "http-status-codes";

export class CategoryHandler {
  private service: CategoryServiceDomain;

  constructor(service: CategoryServiceDomain) {
    this.service = service;
  }

  createCategory = async (req: Request, res: Response): Promise<any> => {
    // merge JSON fields and uploaded files into payload
    const files = (req.files as any)?.image;
    const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
    const payload = { ...req.body, images };
    const parsed = createCategorySchema.safeParse(payload);
    console.log(parsed, 'lo');

    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: parsed.error.errors });
    }
    const data: CreateCategoryInput = parsed.data;
    const result = await this.service.createCategory(data);
    if (result.status === "error") {
      return res.status(StatusCodes.BAD_REQUEST).json(result);
    }
    res.status(StatusCodes.CREATED).json(result);
  };

  getAllCategories = async (req: Request, res: Response): Promise<any> => {
    // parse pagination and filter params
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || 'displayOrder';
    const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
    const result = await this.service.getAllCategories({ limit, offset, search, sortBy, order });
    if (result.status === "error") {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
    }
    // result.data contains items, metadata
    return res.status(StatusCodes.OK).json(result);
  };

  getCategoryById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const result = await this.service.getCategoryById(id);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };

  updateCategory = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const files = (req.files as any)?.image;
    const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
    const payload = { ...req.body, images };
    const parsed = updateCategorySchema.safeParse(payload);
    if (!parsed.success) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: parsed.error.errors });
    }
    const data: UpdateCategoryInput = parsed.data;
    const result = await this.service.updateCategory(id, data);
    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };

  deleteCategory = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const result = await this.service.deleteCategory(id);
    if (result.status === "error") {
      const code =
        result.statusCode === StatusCodes.NOT_FOUND
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      return res.status(code).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
}

export function CategoryHandlerFun(
  service: CategoryServiceDomain
): CategoryHandler {
  return new CategoryHandler(service);
}
