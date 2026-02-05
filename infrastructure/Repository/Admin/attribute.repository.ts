import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { AttributeListParams, CreateAttributeInput, UpdateAttributeInput } from "../../../api/Request/attribute";
import { AttributeDtls, Attribute } from "../../../api/response/attribute.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { AttributeDomainRepository } from "../../../domain/admin/attributeDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import AttributeModel from "../../../app/model/attribute";
import { ProductModel } from "../../../app/model/product";

/**
 * Repository class for handling Attribute-related database operations
 */
class AttributeRepository implements AttributeDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }
    async findAttributeInProduct(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({
                $or: [
                    { 'customerAttribute.attributeId': new Types.ObjectId(id) },
                    { 'wholesalerAttribute.attributeId': new Types.ObjectId(id) }
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
    async deleteAttribute(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const delteProduct = await AttributeModel.findOneAndUpdate(
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
                    'Error in attribute delete',
                    StatusCodes.NOT_FOUND,
                    'Attribute with given ID not found'
                );
            }

            const result: SuccessMessage = {
                message: 'Attribute deleted success.'
            };
            return successResponse("Atrribute deleted successfully", StatusCodes.OK, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error delete product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getAttributeList(params: AttributeListParams): Promise<PaginationResult<AttributeDtls> | ErrorResponse> {
        try {
            const { page, limit, type, search } = params;

            const matchStage: any = {
                isActive: true,
                isDelete: false,
            };

            if (search) {
                matchStage.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    {
                        value: {
                            $elemMatch: {
                                value: { $regex: search, $options: 'i' }
                            }
                        }
                    }
                ];
            }

            const pipeline: any = [
                {
                    $match: matchStage
                },
            ];
            if (type !== 'all') {

                pipeline.push(
                    { $skip: page * limit },
                    { $limit: limit }
                );
            }

            const attributeDtls = await AttributeModel.aggregate(pipeline);
            const count = await AttributeModel.countDocuments({ isActive: true, isDelete: false });
            return Pagination(count, attributeDtls, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving attribute details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findAttributeById(id: string): Promise<ApiResponse<AttributeDtls> | ErrorResponse> {
        try {
            const attribute = await AttributeModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            if (!attribute) {
                return createErrorResponse('Attribute not found.', StatusCodes.BAD_REQUEST, 'Error attribute not found');
            }

            const result: AttributeDtls = {
                _id: attribute._id.toString(),
                name: attribute.name,
                value: attribute.value,
                isActive: attribute.isActive,
                createdAt: attribute.createdAt,
                updatedAt: attribute.updatedAt,
                createdBy: attribute.createdBy.toString(),
                modifiedBy: attribute.modifiedBy.toString()
            };

            return successResponse('Attribute details retrieved successfully', StatusCodes.OK, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving attribute details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findAttributeId(id: string): Promise<Boolean | ErrorResponse> {
        try {
            const attribute = await AttributeModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });
            return !!attribute;
        } catch (error: any) {
            return createErrorResponse(
                'Error finding attribute',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findAttributeNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await AttributeModel.countDocuments({
                _id: { $ne: new Types.ObjectId(id) },
                name: name,
                isActive: true,
                isDelete: false
            });

            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking attribute name existence',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findAttributeNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await AttributeModel.countDocuments({
                name: name,
                isActive: true,
                isDelete: false
            });

            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking attribute name existence',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createAttribute(attributeInput: CreateAttributeInput, userId: string): Promise<ApiResponse<Attribute> | ErrorResponse> {
        try {
            const valueDtls = attributeInput.value.split(",").map((e) => ({ value: e.trim() }));

            const input = {
                name: attributeInput.name.trim(),
                value: valueDtls,
                isDelete: false,
                isActive: true,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
            };


            await AttributeModel.create(input);

            const result: Attribute = {
                name: attributeInput.name,
                value: attributeInput.value
            };

            return successResponse("Attribute created successfully", StatusCodes.CREATED, result);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating attribute',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateAttribute(attributeInput: UpdateAttributeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            // Step 1: Parse new values
            const newValues = attributeInput.value.split(",").map((e) => e.trim());

            // Step 2: Fetch existing attribute document
            const existingAttribute = await AttributeModel.findById(attributeInput.id).lean();
            if (!existingAttribute) {
                return createErrorResponse('Attribute not found', StatusCodes.NOT_FOUND, 'Invalid attribute ID');
            }

            // Step 3: Map new values to existing _id if available
            const updatedValues = newValues.map((val, index) => {
                const existing = existingAttribute.value?.[index];
                return existing && existing._id
                    ? { _id: existing._id, value: val }
                    : { value: val }; // fallback if index out of range
            });

            // Step 4: Update document
            await AttributeModel.updateOne(
                { _id: new Types.ObjectId(attributeInput.id) },
                {
                    $set: {
                        name: attributeInput.name.trim(),
                        value: updatedValues,
                        modifiedBy: new Types.ObjectId(userId),
                    }
                }
            );

            return successResponse("Attribute updated successfully", StatusCodes.OK, {
                message: 'Attribute update success.'
            });
        } catch (error: any) {
            return createErrorResponse(
                'Error updating attribute',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

}

// Factory function to create a new AttributeRepository instance
export function NewAttributeRepository(db: any): AttributeDomainRepository {
    return new AttributeRepository(db);
}
