import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { UpdateBrandInput, CreateBrandInput } from "../../../api/Request/brand";
import { BrandDtls, Brand } from "../../../api/response/brand.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { BrandDomainRepository, BrandListParams } from "../../../domain/admin/brandDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import BrandModel from "../../../app/model/brand";
import { ProductModel } from "../../../app/model/product";

/**
 * Repository class for handling Brand-related database operations
 */
class BrandRepository implements BrandDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }
    async findBrandInProduct(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({
                brand: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            return count === 1;
        } catch (error: any) {
            return createErrorResponse(
                "Error finding brand in product",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async deleteBrand(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const delteProduct = await BrandModel.findOneAndUpdate(
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
                    'Error in brand delete',
                    StatusCodes.NOT_FOUND,
                    'brand with given ID not found'
                );
            }

            const result: SuccessMessage = {
                message: 'Brand deleted success.'
            };
            return successResponse("Brand deleted successfully", StatusCodes.OK, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error delete brand',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }

    }
    async getBrandList(params: BrandListParams): Promise<PaginationResult<BrandDtls> | ErrorResponse> {
        try {
            const { page, limit, type } = params

            const pipeline: any = [
                {
                    $match: {
                        isActive: true,
                        isDelete: false
                    }
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'modifiedBy',
                        foreignField: '_id',
                        as: 'modifiedBy'
                    }
                },
                {
                    $project: {
                        name: 1,
                        isActive: 1,
                        isDelete: 1,
                        createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
                        modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
                        logo: 1
                    }
                },

            ];

            if (type !== 'all') {
                pipeline.push(
                    { $skip: page * limit },
                    { $limit: limit }
                );
            }

            const brandDtls = await BrandModel.aggregate(pipeline);
            const count = await BrandModel.countDocuments({ isActive: 1, isDelete: 0 })
            return Pagination(count, brandDtls, limit, page)
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving brand details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBrandById(id: string): Promise<ApiResponse<BrandDtls> | ErrorResponse> {
        try {

            const brand = await BrandModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            }).populate('createdBy', 'name').populate('modifiedBy', 'name')

            if (!brand) {
                return createErrorResponse('Brand not found.', StatusCodes.BAD_REQUEST, 'Error brand not found');
            }

            const result: BrandDtls = {
                _id: brand._id.toString(),
                name: brand.name,
                logo: {
                    docName: brand.logo?.docName || '',
                    docPath: brand.logo?.docPath || '',
                    originalName: brand.logo?.originalName || ''
                },
                isActive: brand.isActive,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt,
                createdBy: brand.createdBy.toString(),
                modifiedBy: brand.modifiedBy.toString()
            };

            return successResponse('Brand details retrieved successfully', StatusCodes.OK, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving brand details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async findBrandId(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const count = await BrandModel.countDocuments({
                _id: new Types.ObjectId(id),
            });

            console.log(count);

            return count == 1
        } catch (error: any) {
            return createErrorResponse(
                'Error  brand not found',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async findBrandNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number; } | ErrorResponse> {
        try {
            const count = await this.db.collection('brands').countDocuments({
                _id: { $ne: new Types.ObjectId(id) },
                name: name.trim(),
                isDelete: false,
                isActive: true
            });

            return {
                count,
                statusCode: StatusCodes.OK
            };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking brand name existence',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async updateBrand(brandInput: UpdateBrandInput, logo: any, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const input = {
                name: brandInput.name.trim(),
                modifiedBy: userId
            };

            if (logo && logo.length > 0) {
                for (const element of logo) {
                    await BrandModel.updateOne(
                        { _id: new Types.ObjectId(brandInput.id) },
                        {
                            $set: {
                                name: input.name,
                                logo: element,
                                modifiedBy: new Types.ObjectId(userId),
                            }
                        }
                    );
                }
            } else {
                await BrandModel.updateOne(
                    { _id: new Types.ObjectId(brandInput.id) },
                    {
                        $set: {
                            name: input.name,
                            modifiedBy: new Types.ObjectId(userId),
                        }
                    }
                );
            }

            const result: SuccessMessage = {
                message: 'Brand update success.'
            };

            return successResponse("Brand updated successfully", StatusCodes.OK, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error update brand',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    /**
     * Check if a brand with the given name already exists
     * @param name - The brand name to check
     * @returns Object containing count and status code, or error response
     */
    async findBrandNameExist(name: string): Promise<{ count: number, statusCode: number } | ErrorResponse> {
        try {
            const count = await this.db.collection('brands').countDocuments({
                name: name.trim(),
                isDelete: false,
                isActive: true
            });

            return {
                count,
                statusCode: StatusCodes.OK
            };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking brand name existence',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    /**
     * Create a new brand
     * @param brandInput - The brand data to create
     * @returns ApiResponse containing the created brand, or error response
     */
    async createBrand(brandInput: CreateBrandInput, logo: any, userId: string): Promise<ApiResponse<Brand> | ErrorResponse> {
        try {

            if (logo.length > 0) {
                for (const element of logo) {
                    console.log('enter into logo');

                    const input = {
                        name: brandInput.name.trim(),
                        logo: element,
                        createdBy: new Types.ObjectId(userId),
                        modifiedBy: new Types.ObjectId(userId),
                    };

                    await BrandModel.create(input);
                }
            } else {
                console.log('enter into logo 2');

                const input = {
                    name: brandInput.name.trim(),
                    logo: {
                        docName: '',
                        docPath: '',
                        originalName: ''
                    },
                    createdBy: new Types.ObjectId(userId),
                    modifiedBy: new Types.ObjectId(userId),
                };
                await BrandModel.create(input);
            }

            const result: Brand = {
                name: brandInput.name
            };

            return successResponse("Brand created successfully", StatusCodes.OK, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating brand',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

/**
 * Factory function to create a new BrandRepository instance
 * @param db - MongoDB database instance
 * @returns BrandDomainRepository instance
 */
export function NewBrandRrpository(db: any): BrandDomainRepository {
    return new BrandRepository(db);
}