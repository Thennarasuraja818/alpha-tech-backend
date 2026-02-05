import { ICategoryRepository } from "../../../domain/website/category.domain";
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
  private db: any;

  constructor(db: any) {
    this.db = db;
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
      limit = 10,
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

}

export function newCategoryRepository(db: any): ICategoryRepository {
  return new CategoryRepository(db);
}
