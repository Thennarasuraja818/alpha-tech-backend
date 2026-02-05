import { IChildCategoryRepository } from "../../../domain/admin/childCategoryDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import ChildCategory, {
  IChildCategory,
} from "../../../app/model/childCategory";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import {
  CreateChildCategoryInput,
  UpdateChildCategoryInput,
} from "../../../api/Request/childCategory";
import { StatusCodes } from "http-status-codes";
import { UploadedFile } from "express-fileupload";
import { Uploads } from "../../../utils/uploads/image.upload";
import { Types } from "mongoose";

export class ChildCategoryRepository implements IChildCategoryRepository {
  async createChildCategory(
    data: CreateChildCategoryInput
  ): Promise<ApiResponse<IChildCategory> | ErrorResponse> {
    try {
      const checkCategory = await ChildCategory.findOne({ slug: data.slug, isDelete: false });
      if (checkCategory) {
        return createErrorResponse(
          "Child Category already exists",
          StatusCodes.BAD_REQUEST
        );
      }
      const imageArr = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "childcategory",
          "img",
          "", ""
        );
        imageArr.push(...image);
      }
      data.images = imageArr;
      const item: any = await ChildCategory.create(data);
      if (item) {
        const categoriesToUpdate = await ChildCategory.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await ChildCategory.findByIdAndUpdate(cat._id, { $inc: { displayOrder: 1 } });
        }
      }
      return successResponse(
        "Child category created",
        StatusCodes.CREATED,
        item
      );
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getChildCategoryById(
    id: string
  ): Promise<ApiResponse<IChildCategory> | ErrorResponse> {
    try {
      const item = await ChildCategory.findById(id);
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Found", StatusCodes.OK, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async getAllChildCategoriesBySubcategory(
    subcategoryId: string
  ): Promise<ApiResponse<IChildCategory[]> | ErrorResponse> {
    try {
      const items = await ChildCategory.find({ subcategory: subcategoryId });
      return successResponse("Found", StatusCodes.OK, items);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async getAllChildCategories(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<
    | ApiResponse<{
      items: IChildCategory[];
      total: number;
      limit: number;
      offset: number;
    }>
    | ErrorResponse
  > {
    const {
      limit = 10,
      offset = 0,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = options;

    try {


      const basePipeline: any[] = [
        { $match: { isDelete: false } },
        ...(search ? [{
          $lookup: {
            from: 'subcategories',
            localField: 'subcategory',
            foreignField: '_id',
            as: 'subcategory'
          }
        },
        { $unwind: '$subcategory' },
        {
          $lookup: {
            from: 'categories',
            localField: 'subcategory.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $match: {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { 'category.name': { $regex: search, $options: 'i' } },
              { 'subcategory.name': { $regex: search, $options: 'i' } }
            ]
          }
        }] : [])
      ];

      const countPipeline = [...basePipeline, { $count: 'total' }];
      const countResult = await ChildCategory.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;
      const dataPipeline = [
        ...(search ? basePipeline : [
          ...basePipeline,
          {
            $lookup: {
              from: 'subcategories',
              localField: 'subcategory',
              foreignField: '_id',
              as: 'subcategory'
            }
          },
          { $unwind: '$subcategory' },
          {
            $lookup: {
              from: 'categories',
              localField: 'subcategory.category',
              foreignField: '_id',
              as: 'category'
            }
          },
          { $unwind: '$category' }
        ]),
        { $sort: { [sortBy]: order === 'desc' ? -1 : 1 } },
        { $skip: Number(offset) },
        { $limit: Number(limit) }
      ];

      const items = await ChildCategory.aggregate(dataPipeline);

      return successResponse("List fetched", StatusCodes.OK, {
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

  async updateChildCategory(
    id: string,
    data: UpdateChildCategoryInput
  ): Promise<ApiResponse<IChildCategory> | ErrorResponse> {
    try {
      const checkChildCategory: any = await ChildCategory.findOne({
        slug: data.slug,
      });
      const checkCategory = await ChildCategory.findOne({ _id: { $ne: id }, slug: data.slug, isDelete: false });
      if (checkCategory) {
        return createErrorResponse(
          "Child Category already exists",
          StatusCodes.BAD_REQUEST
        );
      }
      const imageArr = [];
      if (data?.images as unknown as UploadedFile) {
        const image = await Uploads.processFiles(
          data?.images,
          "childcategory",
          "img",
          checkChildCategory?.images[0]?.docName ?? ""
        );
        imageArr.push(...image);
      }
      data.images = imageArr.length > 0 ? imageArr : checkChildCategory?.images;
      const item = await ChildCategory.findByIdAndUpdate({ _id: new Types.ObjectId(id) }, data, {
        new: true,
      });
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      if (item) {
        const categoriesToUpdate = await ChildCategory.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await ChildCategory.findByIdAndUpdate(cat._id, { $inc: { displayOrder: 1 } });
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

  async deleteChildCategory(
    id: string
  ): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      const item = await ChildCategory.findByIdAndDelete(id);
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      if (item) {
        const categoriesToUpdate = await ChildCategory.find({
          _id: { $ne: item._id },
          displayOrder: { $gte: item.displayOrder },
        }).sort({ displayOrder: 1 });

        for (const cat of categoriesToUpdate) {
          await ChildCategory.findByIdAndUpdate(cat._id, { $inc: { displayOrder: -1 } });
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

export function newChildCategoryRepository(): IChildCategoryRepository {
  return new ChildCategoryRepository();
}
