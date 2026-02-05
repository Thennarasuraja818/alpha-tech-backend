import { ISubcategoryRepository } from "../../../domain/website/subcategory.domain";
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
  private db: any;

  constructor(db: any) {
    this.db = db;
  }
  async getSubcategoryById(
    id: string
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    try {
      const item = await Subcategory.findById(id);
      if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Found", StatusCodes.OK, item);
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
    page?: number;
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
        sortBy = "displayOrder",
        order = "asc",
      } = options;
      console.log(typeof options.limit, 'limit');

      const page = options?.page && !isNaN(+options.page) ? +options.page : 1;
      const limit = options?.limit && !isNaN(+options.limit) ? +options.limit : 100;

      const offset = (page - 1) * limit;
      console.log(offset, 'offset');

      const pipeline: any[] = [];
      pipeline.push({
        $match: {
          isActive: true, isDelete: false, status: true
        }
      })
      if (categoryId) {
        pipeline.push({
          $match: { category: new Types.ObjectId(categoryId) },
        });
      }

      if (search) {
        pipeline.push({
          $match: {
            name: { $regex: search, $options: "i" },
          },
        });
      }

      pipeline.push({
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      });

      pipeline.push({
        $sort: {
          [sortBy]: order === "desc" ? -1 : 1,
        },
      });

      const [countResult, items] = await Promise.all([
        Subcategory.aggregate([...pipeline, { $count: "total" }]),
        Subcategory.aggregate([
          ...pipeline,
          { $skip: offset },
          { $limit: limit },
        ]),
      ]);

      return successResponse("List fetched", StatusCodes.OK, {
        items,
        total: countResult[0]?.total || 0,
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



}

export function newSubcategoryRepository(db: any): ISubcategoryRepository {
  return new SubcategoryRepository(db);
}
