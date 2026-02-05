import { ReviewModel } from "../../../app/model/review";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { successResponse } from "../../../utils/common/commonResponse";
import { CreateReviewInput } from "../../../api/Request/review";
import { IMobileReviewRepository, reviewDomains } from "../../../domain/mobile-app/review.domain";
import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import { Types } from "mongoose";
import { UploadedFile } from "express-fileupload";
import { Uploads } from "../../../utils/uploads/image.upload";
import Pagination from "../../../api/response/paginationResponse";

class ReviewRepository implements IMobileReviewRepository {
    private readonly db: any;
    constructor(db: any) {
        this.db = db;
    }

    async createReview(data: CreateReviewInput) {
        try {
            const imageArr = [];
            if (data?.images as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    data?.images,
                    "reviews",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }
            data.images = imageArr;
            const doc = await ReviewModel.create(data);
            return successResponse("Created", StatusCodes.CREATED, doc);
        } catch (err: any) {
            return createErrorResponse("Error creating review", StatusCodes.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    async getAllReviews(params: reviewDomains) {
        try {
            const { limit, page, productId } = params;

            const query: any = {};
            query.isActive = true;
            query.isDelete = false;
            if (productId) {
                query.productId = new Types.ObjectId(productId);
            }
            //   const docs = await ReviewModel.find().lean();
            const data = await ReviewModel.find(query)
                .skip(page * limit)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await ReviewModel.countDocuments(query);

            return Pagination(total, data, limit, page);

        } catch (err: any) {
            return createErrorResponse("Error fetching reviews", StatusCodes.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    async getReviewById(id: string) {
        try {
            const doc = await ReviewModel.findById(id).lean();
            if (!doc) return createErrorResponse("Not found", StatusCodes.NOT_FOUND, "Review not found");
            return successResponse("OK", StatusCodes.OK, doc);
        } catch (err: any) {
            return createErrorResponse("Error fetching review", StatusCodes.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    async updateReview(id: string, data: CreateReviewInput) {
        try {
            const imageArr = [];
            const docVal = await ReviewModel.findOne({ _id: id });
            if (!docVal) return createErrorResponse("Not found", StatusCodes.NOT_FOUND, "Review not found");

            if (data?.images as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    data?.images,
                    "reviews",
                    "img",
                    docVal?.images[0]?.docName
                );
                imageArr.push(...image);
            }
            data.images = imageArr;
            const doc = await ReviewModel.findByIdAndUpdate(id, data, { new: true }).lean();
            if (!doc) return createErrorResponse("Not found", StatusCodes.NOT_FOUND, "Review not found");

            return successResponse("Updated", StatusCodes.OK, doc);
        } catch (err: any) {
            return createErrorResponse("Error updating review", StatusCodes.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    async deleteReview(id: string) {
        try {
            const doc = await ReviewModel.findByIdAndDelete(id).lean();
            if (!doc) return createErrorResponse("Not found", StatusCodes.NOT_FOUND, "Review not found");
            return successResponse("Deleted", StatusCodes.OK, doc);
        } catch (err: any) {
            return createErrorResponse("Error deleting review", StatusCodes.INTERNAL_SERVER_ERROR, err.message);
        }
    }
}
export function newReviewRepository(db: any): IMobileReviewRepository {
    return new ReviewRepository(db)
}