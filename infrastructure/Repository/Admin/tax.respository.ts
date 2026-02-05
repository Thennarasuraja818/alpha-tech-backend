import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { TaxListParams, CreateTaxInput, UpdateTaxInput } from "../../../api/Request/tax";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { TaxDomainRepository } from "../../../domain/admin/taxDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import TaxModel from "../../../app/model/tax";
import { ProductModel } from "../../../app/model/product";

class TaxRepository implements TaxDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }

    async findTaxNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await TaxModel.countDocuments({
                taxName: name,
                isActive: true,
                isDeleted: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax name',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await TaxModel.countDocuments({
                taxName: name,
                _id: { $ne: new Types.ObjectId(id) },
                isActive: true,
                isDeleted: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax name',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxInUsage(id: string): Promise<boolean | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({
                'taxes': new Types.ObjectId(id),
                isActive: true,
                isDeleted: false
            });
            return count > 0;
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax usage',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteTax(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const deletedTax = await TaxModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), isDeleted: false },
                {
                    $set: {
                        isDeleted: true,
                        modifiedBy: new Types.ObjectId(userId),
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            if (!deletedTax) {
                return createErrorResponse(
                    'Tax not found',
                    StatusCodes.NOT_FOUND,
                    'Tax with given ID not found'
                );
            }

            return successResponse("Tax deleted successfully", StatusCodes.OK, {
                message: 'Tax deleted successfully'
            });
        } catch (error: any) {
            return createErrorResponse(
                'Error deleting tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getTaxList(params: TaxListParams): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, sort, taxType } = params;

            const query: any = {
                isDeleted: false,
            };

            if (search) {
                query.taxName = { $regex: search, $options: "i" };
            }

            if (taxType) {
                query.taxType = taxType;
            }

            const taxes = await TaxModel.find(query)
                .sort({ createdAt: sort === 'asc' ? 1 : -1 })
                .skip(page * limit)
                .limit(limit);

            const totalCount = await TaxModel.countDocuments(query);

            return Pagination(totalCount, taxes, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving tax list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const tax = await TaxModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDeleted: false
            });

            if (!tax) {
                return createErrorResponse(
                    'Tax not found',
                    StatusCodes.NOT_FOUND,
                    'Tax with given ID not found'
                );
            }

            return successResponse(
                'Tax details retrieved successfully',
                StatusCodes.OK,
                tax
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving tax details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxId(id: string): Promise<boolean | ErrorResponse> {
        try {
            const tax = await TaxModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDeleted: false
            });
            return !!tax;
        } catch (error: any) {
            return createErrorResponse(
                'Error finding tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createTax(taxInput: CreateTaxInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {

            const tax = new TaxModel({
                taxName: taxInput.taxName,
                taxType: taxInput.taxType,
                taxRate: taxInput.taxRate,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId)
            });

            const result = await tax.save();
            return successResponse(
                "Tax created successfully",
                StatusCodes.CREATED,
                result
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error creating tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateTax(taxInput: UpdateTaxInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const imageArr: any = [];
            const existingTax = await TaxModel.findOne({ _id: taxInput.id });

            if (!existingTax) {
                return createErrorResponse(
                    'Tax not found',
                    StatusCodes.NOT_FOUND,
                    'Tax not found'
                );
            }
            const updateData = {
                taxName: taxInput.taxName ?? existingTax.taxName,
                taxType: taxInput.taxType ?? existingTax.taxType,
                taxRate: taxInput.taxRate ?? existingTax.taxRate,
                isActive: taxInput.isActive ?? existingTax.isActive,
                modifiedBy: new Types.ObjectId(userId),
                updatedAt: new Date()
            };

            const result = await TaxModel.findByIdAndUpdate(
                { _id: taxInput.id },
                updateData,
                { new: true }
            );

            if (!result) {
                return createErrorResponse(
                    'Error updating tax',
                    StatusCodes.BAD_REQUEST,
                    'Unable to update tax'
                );
            }

            return successResponse(
                "Tax updated successfully",
                StatusCodes.OK,
                result
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error updating tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async toggleTaxStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            // 1. Find the tax document
            const tax = await TaxModel.findOne({ _id: id });

            if (!tax) {
                return createErrorResponse(
                    'Tax not found',
                    StatusCodes.NOT_FOUND,
                    'Tax not found or already deleted'
                );
            }

            // 2. Toggle the isActive status
            const newStatus = !tax.isActive;
            const updateTime = new Date();

            const updatedTax = await TaxModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        isActive: newStatus,
                        modifiedBy: userId,
                        updatedAt: updateTime
                    }
                },
                { new: true }
            );

            if (!updatedTax) {
                return createErrorResponse(
                    'Failed to update tax status',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Update operation failed'
                );
            }

            return successResponse(
                "Tax status updated successfully",
                StatusCodes.OK,
                {
                    message: 'Tax status updated',
                    isActive: newStatus,
                    taxId: updatedTax._id,
                    updatedAt: updateTime
                }
            );
        } catch (error: any) {
            console.error('Error in toggleTaxStatus:', error);

            // More specific error handling
            if (error.name === 'CastError') {
                return createErrorResponse(
                    'Invalid tax ID format',
                    StatusCodes.BAD_REQUEST,
                    'Please provide a valid tax ID'
                );
            }

            return createErrorResponse(
                'Error toggling tax status',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || 'Internal server error'
            );
        }
    }
}

export function NewTaxRepository(db: any): TaxDomainRepository {
    return new TaxRepository(db);
}