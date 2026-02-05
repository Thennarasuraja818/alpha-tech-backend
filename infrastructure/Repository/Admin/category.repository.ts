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

export class CategoryRepository implements ICategoryRepository {
  async createCategory(data: CreateCategoryInput): Promise<ApiResponse<ICategory> | ErrorResponse> {
    try {
      // Check for existing category by slug
      const existingCategory = await Category.findOne({ slug: data.slug });
      if (existingCategory) {
        return createErrorResponse("Category already exists", StatusCodes.BAD_REQUEST);
      }

      // Process uploaded images
      let imageArr: any = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "category",
          "img",
          ''
        );
        imageArr.push(...image);
      }

      // Create category object
      const categoryData: Partial<ICategory> = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        images: imageArr,
        tags: data.tags ?? "",
        featuredCategory: data.featuredCategory ?? false,
        metaKeywords: data.metaKeywords ?? "",
        metaTitle: data.metaTitle ?? "",
        metaDescription: data.metaDescription ?? "",
        displayOrder: data.displayOrder ?? 0,
        status: data.status ?? true,
      };

      const newCategory = await Category.create(categoryData);

      // Adjust displayOrder if conflict occurs
      const existingOrder = await Category.findOne({
        _id: { $ne: newCategory._id },
        displayOrder: newCategory.displayOrder,
        isActive: true,
        isDelete: false,
      });

      if (existingOrder) {
        const categoriesToUpdate = await Category.find({
          _id: { $ne: newCategory._id },
          displayOrder: { $gte: newCategory.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await Category.findByIdAndUpdate(cat._id, { $inc: { displayOrder: 1 } });
        }
      }

      return successResponse("Category created", StatusCodes.CREATED, newCategory);
    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
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
    limit?: number;
    offset?: number;
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
      limit = 0,
      offset = 0,
      search,
      sortBy = "displayOrder",
      order = "asc",
    } = options;
    try {
      const pipeline: any[] = [];
      if (search) {
        pipeline.push({ $match: { name: { $regex: search, $options: "i" } } });
      }
      const sortField = sortBy;
      const sortStage: any = { [sortField]: order === "desc" ? -1 : 1 };
      pipeline.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $sort: sortStage }, { $skip: offset }, { $limit: limit }],
        },
      });
      const agg = await Category.aggregate(pipeline);
      const metadata = agg[0]?.metadata[0];
      const items = agg[0]?.data || [];
      const total = metadata?.total ?? 0;
      return successResponse("List fetched", StatusCodes.OK, {
        items,
        total,
        limit,
        offset,
      });
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
      if (item) {
        const categoriesToUpdate = await Category.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await Category.findByIdAndUpdate(cat._id, { $inc: { displayOrder: 1 } });
        }
      }
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
      if (item) {
        const categoriesToUpdate = await Category.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await Category.findByIdAndUpdate(cat._id, { $inc: { displayOrder: -1 } });
        }
      }
      return successResponse("Deleted", StatusCodes.OK, null);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export function newCategoryRepository(): ICategoryRepository {
  return new CategoryRepository();
}
