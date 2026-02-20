import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { VariantListParams, CreateVariantInput, UpdateVariantInput } from "../../../api/Request/variant";
import { VariantDtls, Variant } from "../../../api/response/variant.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { VariantDomainRepository } from "../../../domain/admin/variantDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import VariantModel from "../../../app/model/variant";

/**
 * Repository class for handling Variant-related database operations
 */
class VariantRepository implements VariantDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }

    async deleteVariant(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const deleteVariant = await VariantModel.findOneAndUpdate(
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

            if (!deleteVariant) {
                return createErrorResponse(
                    'Error in variant delete',
                    StatusCodes.NOT_FOUND,
                    'Variant with given ID not found'
                );
            }

            const result: SuccessMessage = {
                message: 'Variant deleted success.'
            };
            return successResponse("Variant deleted successfully", StatusCodes.OK, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error delete variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getVariantList(params: VariantListParams): Promise<PaginationResult<VariantDtls> | ErrorResponse> {
        try {
            const { page, limit, search } = params;

            const matchStage: any = {
                isActive: true,
                isDelete: false,
            };

            if (search) {
                matchStage.name = { $regex: search, $options: 'i' };
            }

            const pipeline: any = [
                {
                    $match: matchStage
                },
                { $sort: { createdAt: -1 } }
            ];

            const pageIndex = page > 0 ? page : 1;

            const variantDtls = await VariantModel.aggregate([
                ...pipeline,
                { $skip: (pageIndex - 1) * limit },
                { $limit: limit }
            ]);

            const count = await VariantModel.countDocuments(matchStage);
            return Pagination(count, variantDtls, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving variant details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVariantById(id: string): Promise<ApiResponse<VariantDtls> | ErrorResponse> {
        try {
            const variant = await VariantModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            if (!variant) {
                return createErrorResponse('Variant not found.', StatusCodes.BAD_REQUEST, 'Error variant not found');
            }

            const result: VariantDtls = {
                _id: variant._id.toString(),
                name: variant.name,
                isActive: variant.isActive,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt,
                createdBy: variant.createdBy.toString(),
                modifiedBy: variant.modifiedBy.toString()
            };

            return successResponse('Variant details retrieved successfully', StatusCodes.OK, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving variant details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVariantId(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const variant = await VariantModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });
            return !!variant;
        } catch (error: any) {
            return createErrorResponse(
                'Error finding variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVariantNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await VariantModel.countDocuments({
                _id: { $ne: new Types.ObjectId(id) },
                name: name,
                isActive: true,
                isDelete: false
            });

            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking variant name existence',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVariantNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await VariantModel.countDocuments({
                name: name,
                isActive: true,
                isDelete: false
            });

            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking variant name existence',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createVariant(variantInput: CreateVariantInput, userId: string): Promise<ApiResponse<Variant> | ErrorResponse> {
        try {
            const input = {
                name: variantInput.name.trim(),
                isDelete: false,
                isActive: true,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
            };

            await VariantModel.create(input);

            const result: Variant = {
                name: variantInput.name,
            };

            return successResponse("Variant created successfully", StatusCodes.CREATED, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateVariant(variantInput: UpdateVariantInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            await VariantModel.updateOne(
                { _id: new Types.ObjectId(variantInput.id) },
                {
                    $set: {
                        name: variantInput.name.trim(),
                        modifiedBy: new Types.ObjectId(userId),
                    }
                }
            );

            return successResponse("Variant updated successfully", StatusCodes.OK, {
                message: 'Variant update success.'
            });
        } catch (error: any) {
            return createErrorResponse(
                'Error updating variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

// Factory function to create a new VariantRepository instance
export function NewVariantRepository(db: any): VariantDomainRepository {
    return new VariantRepository(db);
}
