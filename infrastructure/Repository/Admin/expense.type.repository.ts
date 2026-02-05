import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/commonResponse";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { Types } from "mongoose";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { ExpenseTypeDomainRepository, ExpenseTypeListParams } from "../../../domain/admin/expense.typeDomain";
import ExpenseTypes from "../../../app/model/expense.type";
import { CreateExpenseTypeInput, UpdateExpenseTypeInput } from "../../../api/Request/expense.type";
import Pagination from "../../../api/response/paginationResponse";

class ExpenseTypeRepository implements ExpenseTypeDomainRepository {

    db: any
    constructor(db: any) {
        this.db = db
    }

    async deleteExpenseType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const deleteExpenseType = await ExpenseTypes.findOneAndUpdate(
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

            if (!deleteExpenseType) {
                return createErrorResponse(
                    'Error in expense type delete',
                    StatusCodes.NOT_FOUND,
                    'Expense type with given ID not found'
                );
            }

            return successResponse("Expense type deleted successfully", StatusCodes.OK, { message: "Expense type deleted successfully" });

        } catch (error: any) {
            return createErrorResponse(
                "Error in expense type delete",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getExpenseTypeList(params: ExpenseTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse> {
        try {
            const { page, limit, search } = params;
            const pipeLine = [];

            const matchFilter: any = {
                isActive: true,
                isDelete: false
            };

            if (search) {
                matchFilter.name = { $regex: search, $options: "i" };
            }

            pipeLine.push(
                {
                    $match: matchFilter
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
                        _id: 1,
                        name: 1,
                        isDelete: 1,
                        isActive: 1,
                        createdByName: { $arrayElemAt: ['$createdBy.name', 0] },
                        modifiedByName: { $arrayElemAt: ['$modifiedBy.name', 0] },
                        createdAt: 1,
                        updatedAt: 1,
                    }
                }
            );

            if (limit > 0) {
                pipeLine.push(
                    { $skip: page * limit },
                    { $limit: limit }
                );
            }

            const [result, count] = await Promise.all([
                ExpenseTypes.aggregate(pipeLine),
                limit > 0 ? ExpenseTypes.countDocuments(matchFilter) : 0
            ]);

            return Pagination(count, result, limit, page);

        } catch (error: any) {
            return createErrorResponse(
                "Error in list expense types",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createExpenseType(input: CreateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            const exists = await ExpenseTypes.findOne({ name: input.name, isActive: true, isDelete: false });
            if (exists) {
                return createErrorResponse(
                    "Expense type already exists",
                    StatusCodes.BAD_REQUEST,
                    "Expense type with given name already exists"
                );
            }

            const result = await ExpenseTypes.create({
                name: input.name,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId)
            });

            if (!result) {
                return createErrorResponse(
                    "Expense type creation error",
                    StatusCodes.BAD_REQUEST,
                    "Unable to create expense type"
                );
            }

            return successResponse("Expense type created successfully", StatusCodes.OK, { message: '' });

        } catch (error: any) {
            return createErrorResponse(
                "Error in create expense type",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateExpensetype(input: UpdateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            const result = await ExpenseTypes.findByIdAndUpdate(input.id, {
                name: input.name,
                modifiedBy: new Types.ObjectId(userId)
            });

            if (!result) {
                return createErrorResponse(
                    "Unable to find expense type",
                    StatusCodes.BAD_REQUEST,
                    "Unable to find expense type"
                );
            }

            return successResponse("Expense type updated successfully", StatusCodes.OK, { message: '' });

        } catch (error: any) {
            return createErrorResponse(
                "Error in update expense type",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getExpensetypeById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const result = await ExpenseTypes.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            if (!result) {
                return createErrorResponse(
                    'Expense type not found',
                    StatusCodes.NOT_FOUND,
                    'Expense type with given ID not found'
                );
            }

            return {
                status: 'success',
                statusCode: StatusCodes.OK,
                message: 'Expense type retrieved successfully',
                data: result
            };

        } catch (error: any) {
            return createErrorResponse(
                'Error in finding expense type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function RegisterNewExpenseTypeReposiorty(db: any): ExpenseTypeDomainRepository {
    return new ExpenseTypeRepository(db)
}