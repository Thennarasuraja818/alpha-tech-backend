import { ICategoryRepository } from "../../../domain/admin/categoryDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import Category, { ICategory } from "../../../app/model/category";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../../api/Request/category";
import { StatusCodes } from "http-status-codes";
import { Uploads } from "../../../utils/uploads/image.upload";
import { UploadedFile } from "express-fileupload";
import { Types } from "mongoose";
import Pagination from "../../../api/response/paginationResponse";

export class CategoryRepository implements ICategoryRepository {

  private readonly db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createCategory(
    data: CreateCategoryInput
  ): Promise<ApiResponse<ICategory> | ErrorResponse> {
    try {
      const checkCategory = await Category.findOne({ slug: data.slug });
      if (checkCategory) {
        return createErrorResponse(
          "Category already exists",
          StatusCodes.BAD_REQUEST
        );
      }
      const imageArr = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "category",
          "img",
          ''
        );
        imageArr.push(...image);
      }
      const category = new Category();
      category.name = data.name;
      category.slug = data.slug;
      category.description = data.description;
      category.images = imageArr;
      category.tags = data.tags ?? "";
      category.featuredCategory = data.featuredCategory ?? false;
      category.metaKeywords = data.metaKeywords ?? "";
      category.metaTitle = data.metaTitle ?? "";
      category.metaDescription = data.metaDescription ?? "";
      category.displayOrder = data.displayOrder ?? 0;
      category.status = data.status ?? true;
      const item = await Category.create(category);
      return successResponse("Category created", StatusCodes.CREATED, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCategoryById(
    id: string
  ): Promise<ApiResponse<ICategory> | ErrorResponse> {
    try {
      const item = await Category.findById(id);
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Found", StatusCodes.OK, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllCategories(options: {
    limit?: number | string;
    offset?: number | string;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<
    | ApiResponse<{
      items: ICategory[];
      total: number;
      limit: number;
      offset: number;
    }>
    | ErrorResponse
  > {
    const {
      search,
      sortBy = "displayOrder",
      order = "asc",
    } = options;

    // Parse limit and offset
    const parsedLimit = parseInt(String(options.limit ?? ""), 10);
    const parsedOffset = parseInt(String(options.offset ?? ""), 10);

    const limit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100;
    const offset = !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    try {
      const pipeline: any[] = [];

      pipeline.push({
        $match: {
          isActive: true, isDelete: false, status: true
        }
      })

      if (search) {
        pipeline.push({
          $match: {
            name: { $regex: search, $options: "i" },
          },
        });
      }

      const dataPipeline: any[] = [
        { $sort: { [sortBy]: order === "desc" ? -1 : 1 } },
        { $skip: offset },
        { $limit: limit },
      ];

      pipeline.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: dataPipeline,
        },
      });

      const [result] = await Category.aggregate(pipeline);
      const total = result?.metadata?.[0]?.total || 0;
      const items: ICategory[] = result?.data || [];

      return Pagination(total, items, limit, offset);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }



  async updateCategory(
    id: string,
    data: UpdateCategoryInput
  ): Promise<ApiResponse<ICategory> | ErrorResponse> {
    try {
      const categoryVal = await Category.findOne({
        _id: new Types.ObjectId(id),
      });
      const checkCategory = await Category.findOne({
        slug: data.slug,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (checkCategory) {
        return createErrorResponse(
          "Category already exists",
          StatusCodes.BAD_REQUEST
        );
      }
      const imageArr = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "category",
          "img",
          categoryVal?.images[0].docName
        );
        imageArr.push(...image);
      }
      console.log(data, "data");
      const category: any = {};
      category.name = data.name ?? "";
      category.slug = data.slug ?? "";
      category.description = data.description ?? "";
      category.images = imageArr.length > 0 ? imageArr : categoryVal?.images;
      category.tags = data.tags ?? "";
      category.featuredCategory = data.featuredCategory ?? false;
      category.metaKeywords = data.metaKeywords ?? "";
      category.metaTitle = data.metaTitle ?? "";
      category.metaDescription = data.metaDescription ?? "";
      category.displayOrder = data.displayOrder ?? 0;
      category.status = data.status ?? true;
      const item = await Category.findByIdAndUpdate(id, category, {
        new: true,
      });
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Updated", StatusCodes.OK, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteCategory(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      const item = await Category.findByIdAndDelete(id);
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Deleted", StatusCodes.OK, null);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export function newCategoryRepository(db: any): ICategoryRepository {
  return new CategoryRepository(db);
}
