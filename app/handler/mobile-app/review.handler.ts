import { Request, Response } from "express";
import { MobileReviewServiceDomain } from "../../../domain/mobile-app/review.domain";
import { sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";

export function ReviewHandlerFun(service: MobileReviewServiceDomain) {
    return {
        createReview: async (req: Request, res: Response) => {
            const files = (req.files as any)?.image;
            const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
            const payload = { ...req.body, images };

            const result = await service.createReview(payload);
            sendResponse(res, result);
        },
        getAllReviews: async (req: Request, res: Response) => {


            const page = parseInt(req.query.page as string) || 0;
            const limit = parseInt(req.query.limit as string) || 10;
            const productId = req.query.productId as string || '';

            const result = await service.getAllReviews({
                limit, page, productId
            });
            sendPaginationResponse(res, result);

        },
        getReviewById: async (req: Request, res: Response) => {
            const result = await service.getReviewById(req.params.id as any);
            sendResponse(res, result);
        },
        updateReview: async (req: Request, res: Response) => {
            const result = await service.updateReview(req.params.id as any, req.body);
            sendResponse(res, result);
        },
        deleteReview: async (req: Request, res: Response) => {
            const result = await service.deleteReview(req.params.id as any);
            sendResponse(res, result);
        },
    };
}