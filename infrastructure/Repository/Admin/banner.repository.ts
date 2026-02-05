import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { BannerListParams, CreateBannerInput, UpdateBannerInput } from "../../../api/Request/Banner";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { BannerDomainRepository } from "../../../domain/admin/bannerDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import BannerModel from "../../../app/model/BannersModel";
import { ProductModel } from "../../../app/model/product";
import { UploadedFile } from "express-fileupload";
import { Uploads } from "../../../utils/uploads/image.upload";

/**
 * Repository class for handling Banner-related database operations
 */
class BannerRepository implements BannerDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }
    findBannerNameExist(name: string): Promise<{ count: number; statusCode: number; } | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    findBannerNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number; } | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    async findBannerInProduct(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({
                $or: [
                    { 'customerBanner.BannerId': new Types.ObjectId(id) },
                    { 'wholesalerBanner.BannerId': new Types.ObjectId(id) }
                ],
                isActive: true,
                isDelete: false
            });

            return count > 0

        } catch (error) {
            return createErrorResponse(
                'Error in find attritube in product  ',
                StatusCodes.NOT_FOUND,
                'attritube with given ID not found'
            );
        }
    }
    async deleteBanner(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const delteProduct = await BannerModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), isActive: true, isDelete: false },
                {
                    $set: {
                        isDelete: true,
                        modifiedBy: new Types.ObjectId(userId),
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            if (!delteProduct) {
                return createErrorResponse(
                    'Error in Banner delete',
                    StatusCodes.NOT_FOUND,
                    'Banner with given ID not found'
                );
            }

            const result: SuccessMessage = {
                message: 'Banner deleted success.'
            };
            return successResponse("Bannet deleted successfully", StatusCodes.OK, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error delete product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getBannerList(params: BannerListParams): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search } = params;

            const query: any = {};
            query.isDelete = false;
            query.isActive = true;
            if (search) {
                query.name = { $regex: search, $options: "i" };
            }


            const cartItems = await BannerModel.find(query)
                .limit(limit)
                .skip(page)

            const totalCount = await BannerModel.countDocuments(query);
            return Pagination(totalCount, cartItems, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving Banner details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBannerById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const Banner = await BannerModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            if (!Banner) {
                return createErrorResponse('Banner not found.', StatusCodes.BAD_REQUEST, 'Error Banner not found');
            }


            return successResponse('Banner details retrieved successfully', StatusCodes.OK, Banner);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving Banner details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBannerId(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const Banner = await BannerModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });
            return !!Banner;
        } catch (error: any) {
            return createErrorResponse(
                'Error finding Banner',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createBanner(BannerInput: CreateBannerInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const existingBanner = await BannerModel.findOne({
                name: {
                    $regex: `^${BannerInput.name.trim()}$`,
                    $options: "i"
                }
            });

            if (existingBanner) {
                return createErrorResponse(
                    'Banner name already exists',
                    StatusCodes.BAD_REQUEST,
                    'A banner with this name already exists'
                );
            }
            const imageArr: any = [];
            if (BannerInput?.images as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    BannerInput?.images,
                    "banners",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }

            const banner = new BannerModel();
            banner.name = BannerInput.name;
            banner.images = imageArr;
            banner.createdBy = new Types.ObjectId(userId);
            banner.modifiedBy = new Types.ObjectId(userId);
            const result = await BannerModel.create(banner);

            return successResponse("Banner created successfully", StatusCodes.CREATED, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating Banner',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateBanner(BannerInput: UpdateBannerInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const imageArr: any = [];
            const bannerData = await BannerModel.findOne({ _id: BannerInput.id });
            if (!bannerData) {
                return createErrorResponse(
                    'Banner not found',
                    StatusCodes.BAD_REQUEST,
                    'Banner not found'
                );
            }
            const nameExists = await BannerModel.findOne({
                name: {
                    $regex: `^${BannerInput.name.trim()}$`,
                    $options: "i"
                },
                _id: { $ne: BannerInput.id }
            });

            if (nameExists) {
                return createErrorResponse(
                    'Banner name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Another banner with this name already exists'
                );
            }

            if (BannerInput?.images as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    BannerInput?.images,
                    "banners",
                    "img",
                    ''
                );
                imageArr.push(...image);

            }
            if (BannerInput.imageIds && BannerInput.imageIds.trim() !== '') {
                for (const val of BannerInput.imageIds.split(',')) {
                    const imagesData = bannerData.images.find((e) => e._id.toString() === val.trim());
                    imageArr.push(imagesData);
                }
            }
            const banner: any = {};
            banner.images = imageArr ?? bannerData.images;
            banner.name = BannerInput.name;
            banner.modifiedBy = new Types.ObjectId(userId);
            const result = await BannerModel.findByIdAndUpdate({ _id: BannerInput.id }, banner);
            if (!result) {
                return createErrorResponse(
                    'Error creating Banner',
                    StatusCodes.BAD_REQUEST,
                    'Unable to update banner'
                );
            }
            return successResponse("Banner updated successfully", StatusCodes.CREATED, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error updating Banner',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

// Factory function to create a new BannerRepository instance
export function NewBannerRepository(db: any): BannerDomainRepository {
    return new BannerRepository(db);
}
