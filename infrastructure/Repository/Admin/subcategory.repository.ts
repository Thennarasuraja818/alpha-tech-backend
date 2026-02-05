import { ISubcategoryRepository } from "../../../domain/admin/subcategoryDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import Subcategory, { ISubcategory } from "../../../app/model/subcategory";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import {
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from "../../../api/Request/subcategory";
import { StatusCodes } from "http-status-codes";
import { UploadedFile } from "express-fileupload";
import { Uploads } from "../../../utils/uploads/image.upload";
import { Types } from "mongoose";

export class SubcategoryRepository implements ISubcategoryRepository {
  async createSubcategory(
    data: CreateSubcategoryInput
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    try {
      const checkCategory = await Subcategory.findOne({ name: data.name, isDelete: false });
      if (checkCategory) {
        return createErrorResponse(
          "Sub Category already exists",
          StatusCodes.CONFLICT,
        );
      }
      const imageArr = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "subcategory",
          "img",
          ""
        );
        imageArr.push(...image);
      }
      data.images = imageArr;
      const item = await Subcategory.create(data);
      if (item) {
        const categoriesToUpdate = await Subcategory.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await Subcategory.findByIdAndUpdate(cat._id, { $inc: { displayOrder: 1 } });
        }
      }
      return successResponse("Subcategory created successfully", StatusCodes.CREATED, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSubcategoryById(
    id: string
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    try {
      const item = await Subcategory.findById(id);
      if (!item) return createErrorResponse("Subcategory not found", StatusCodes.NOT_FOUND);
      return successResponse("Subcategory found", StatusCodes.OK, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllSubcategoriesByCategory(
    categoryId: string
  ): Promise<ApiResponse<ISubcategory[]> | ErrorResponse> {
    try {
      const item = await Subcategory.find({ category: new Types.ObjectId(categoryId) });
      if (!item) return createErrorResponse("Subcategory not found", StatusCodes.NOT_FOUND);
      return successResponse("Subcategory found", StatusCodes.OK, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllSubcategories(options: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<
    | ApiResponse<{
      items: ISubcategory[];
      total: number;
      limit: number;
      offset: number;
    }>
    | ErrorResponse
  > {
    try {
      const {
        categoryId,
        search,
        sortBy = "createdAt",
        order = "desc",
        limit = options?.limit || 100,
        offset = options?.offset || 0
      } = options;

      const pipeline: any[] = [];

      // Base match stage
      const matchStage: any = { isDelete: false };

      if (categoryId) {
        matchStage.category = new Types.ObjectId(categoryId);
      }

      if (search) {
        matchStage.name = { $regex: search, $options: "i" };
      }

      // Add match stage if we have any conditions
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Add lookup for category
      pipeline.push({
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      });

      // Unwind the category array
      pipeline.push({ $unwind: "$category" });

      // Count total matching documents
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Subcategory.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Add sorting and pagination
      pipeline.push(
        { $sort: { [sortBy]: order === "desc" ? -1 : 1 } },
        { $skip: offset },
        { $limit: limit }
      );

      const items = await Subcategory.aggregate(pipeline);

      return successResponse("Subcategory list fetched successfully", StatusCodes.OK, {
        items,
        total,
        limit,
        offset
      });
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateSubcategory(
    id: string,
    data: UpdateSubcategoryInput
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    try {
      const checkCategory = await Subcategory.findOne({ _id: { $ne: id }, slug: data.slug, isDelete: false });
      if (checkCategory) {
        return createErrorResponse(
          "Sub Category already exists",
          StatusCodes.BAD_REQUEST
        );
      }
      const subCategory: any = await Subcategory.findById(id);
      const imageArr = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "subcategory",
          "img",
          subCategory?.images[0]?.docName ?? ""
        );
        imageArr.push(...image);
      }
      data.images = imageArr.length > 0 ? imageArr : subCategory?.images;
      const item = await Subcategory.findByIdAndUpdate(
        { _id: new Types.ObjectId(id) },
        data,
        { new: true }
      );
      if (!item) return createErrorResponse("Subcategory not found", StatusCodes.NOT_FOUND);
      if (item) {
        const categoriesToUpdate = await Subcategory.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await Subcategory.findByIdAndUpdate(cat._id, { $inc: { displayOrder: 1 } });
        }
      }
      return successResponse("Subcategory updated successfully", StatusCodes.OK, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteSubcategory(
    id: string
  ): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      const item = await Subcategory.findByIdAndDelete(id);
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      if (item) {
        const categoriesToUpdate = await Subcategory.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await Subcategory.findByIdAndUpdate(cat._id, { $inc: { displayOrder: -1 } });
        }
      }
      return successResponse("Subcategory deleted successfully", StatusCodes.OK, null);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export function newSubcategoryRepository(): ISubcategoryRepository {
  return new SubcategoryRepository();
}
