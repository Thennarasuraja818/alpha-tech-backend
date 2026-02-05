import { IChildCategoryRepository } from "../../../domain/website/childCategory.domain";
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
import Pagination from "../../../api/response/paginationResponse";

export class ChildCategoryRepository implements IChildCategoryRepository {
    private db: any;

    constructor(db: any) {
        this.db = db;
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

    async getAllChildCategories(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: "asc" | "desc";
        categoryId: string;
        subcategoryId: string;

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
            search,
            sortBy = "displayOrder",
            order = "asc",
            categoryId, subcategoryId
        } = options;
        const parsedLimit = parseInt(String(options.limit ?? ""), 10);
        const parsedOffset = parseInt(String(options.offset ?? ""), 10);

        const limit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
        const offset = !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
        console.log(limit, 'limit', offset);

        try {
            const pipeline: any[] = [];

            pipeline.push({
                $match: {
                    isActive: true, isDelete: false, status: true
                }
            })
            if (search) {
                pipeline.push({ $match: { name: { $regex: search, $options: "i" } } });
            }

            pipeline.push(
                {
                    $lookup: {
                        from: "subcategories",
                        localField: "subcategory",
                        foreignField: "_id",
                        as: "subcategory",
                    },
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "subcategory.category",
                        foreignField: "_id",
                        as: "category",
                    },
                }, {
                $project: {
                    name: 1,
                    slug: 1,
                    description: 1,
                    images: 1,
                    tags: 1,
                    featuredCategory: 1,
                    metaKeywords: 1,
                    metaTitle: 1,
                    metaDescription: 1,
                    displayOrder: 1,
                    status: 1,
                    // createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
                    // modifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
                    category: 1,
                    isDelete: 1,
                    isActive: 1,
                    subcategory: 1
                }
            }
            );

            if (categoryId) {

                pipeline.push({ $match: { "category._id": new Types.ObjectId(categoryId) } });
            }
            console.log(subcategoryId, 'subCategoryId');

            if (subcategoryId) {
                pipeline.push({ $match: { "subcategory._id": new Types.ObjectId(subcategoryId) } });
            }
            pipeline.push({ $sort: { [sortBy]: order === "desc" ? -1 : 1 } });
            const [countResult, dataResult] = await Promise.all([
                await ChildCategory.aggregate([...pipeline, { $count: "total" }]),
                await ChildCategory.aggregate([
                    ...pipeline,
                    { $skip: offset * limit },
                    { $limit: limit },
                ]),
            ]);
            return Pagination(countResult[0]?.total || 0, dataResult, limit,
                offset,)
        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

}

export function newChildCategoryRepository(db: any): IChildCategoryRepository {
    return new ChildCategoryRepository(db);
}
