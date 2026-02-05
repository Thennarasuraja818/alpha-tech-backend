import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { BankListParams, CreateBankInput, UpdateBankInput } from "../../../api/Request/bank";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { BankDomainRepository } from "../../../domain/admin/bankDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { BankModel } from "../../../app/model/bank";
import { OrderModel } from "../../../app/model/order";

class BankRepository implements BankDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }

    async findBankAccountNumberExist(accountNumber: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await BankModel.countDocuments({
                accountNumber,
                isActive: true,
                isDelete: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking account number',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBankAccountNumberForUpdate(accountNumber: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await BankModel.countDocuments({
                accountNumber,
                _id: { $ne: new Types.ObjectId(id) },
                isActive: true,
                isDelete: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking account number',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBankInUsage(id: string): Promise<boolean | ErrorResponse> {
        try {
            const count = await OrderModel.countDocuments({
                bankId: new Types.ObjectId(id),
                isDelete: false
            });

            return count > 0;
        } catch (error: any) {
            return createErrorResponse(
                'Error checking bank usage',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteBank(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const deletedBank = await BankModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), isDelete: false },
                {
                    $set: {
                        isDelete: true,
                        modifiedBy: new Types.ObjectId(userId),
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            if (!deletedBank) {
                return createErrorResponse(
                    'Bank account not found',
                    StatusCodes.NOT_FOUND,
                    'Bank account with given ID not found'
                );
            }

            return successResponse("Bank account deleted successfully", StatusCodes.OK, {
                message: 'Bank account deleted successfully'
            });
        } catch (error: any) {
            return createErrorResponse(
                'Error deleting bank account',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getBankList(params: BankListParams): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, sort, status } = params;
            const matchStage: any = { isDelete: false };

            if (search) {
                matchStage.$or = [
                    { bankName: { $regex: search, $options: "i" } },
                    { accountNumber: { $regex: search, $options: "i" } },
                    { ifscCode: { $regex: search, $options: "i" } },
                    { branch: { $regex: search, $options: "i" } }
                ];
            }

            if (status) {
                matchStage.status = status;
            }

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $facet: {
                        data: [
                            { $sort: { createdAt: sort === "asc" ? 1 : -1 } },
                            { $skip: page * limit },
                            { $limit: limit }
                        ],
                        totalCount: [{ $count: "count" }]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totalCount: { $arrayElemAt: ["$totalCount.count", 0] }
                    }
                }
            ];

            const result = await BankModel.aggregate(pipeline);

            const banks = result[0]?.data || [];
            const totalCount = result[0]?.totalCount || 0;
            return Pagination(totalCount, banks, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                "Error retrieving bank list",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBankById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const bank = await BankModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            if (!bank) {
                return createErrorResponse(
                    'Bank account not found',
                    StatusCodes.NOT_FOUND,
                    'Bank account with given ID not found'
                );
            }

            return successResponse(
                'Bank account details retrieved successfully',
                StatusCodes.OK,
                bank
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving bank account details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBankId(id: string): Promise<boolean | ErrorResponse> {
        try {
            const bank = await BankModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });
            return !!bank;
        } catch (error: any) {
            return createErrorResponse(
                'Error finding bank account',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createBank(bankInput: CreateBankInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const bank = new BankModel({
                bankName: bankInput.bankName,
                accountNumber: bankInput.accountNumber,
                ifscCode: bankInput.ifscCode,
                accountType: bankInput.accountType,
                branch: bankInput.branch,
                status: bankInput.status,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId)
            });

            const result = await bank.save();
            return successResponse(
                "Bank account created successfully",
                StatusCodes.CREATED,
                result
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error creating bank account',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateBank(bankInput: UpdateBankInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const existingBank = await BankModel.findOne({ _id: bankInput.id });

            if (!existingBank) {
                return createErrorResponse(
                    'Bank account not found',
                    StatusCodes.NOT_FOUND,
                    'Bank account not found'
                );
            }

            const updateData = {
                bankName: bankInput.bankName ?? existingBank.bankName,
                accountNumber: bankInput.accountNumber ?? existingBank.accountNumber,
                ifscCode: bankInput.ifscCode ?? existingBank.ifscCode,
                accountType: bankInput.accountType ?? existingBank.accountType,
                branch: bankInput.branch ?? existingBank.branch,
                status: bankInput.status ?? existingBank.status,
                modifiedBy: new Types.ObjectId(userId),
                updatedAt: new Date()
            };

            const result = await BankModel.findByIdAndUpdate(
                { _id: bankInput.id },
                updateData,
                { new: true }
            );

            if (!result) {
                return createErrorResponse(
                    'Error updating bank account',
                    StatusCodes.BAD_REQUEST,
                    'Unable to update bank account'
                );
            }

            return successResponse(
                "Bank account updated successfully",
                StatusCodes.OK,
                result
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error updating bank account',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async toggleBankStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const bank = await BankModel.findOne({ _id: id });

            if (!bank) {
                return createErrorResponse(
                    'Bank account not found',
                    StatusCodes.NOT_FOUND,
                    'Bank account not found or already deleted'
                );
            }

            const newStatus = bank.status === 'active' ? 'inactive' : 'active';
            const updateTime = new Date();

            const updatedBank = await BankModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        status: newStatus,
                        modifiedBy: userId,
                        updatedAt: updateTime
                    }
                },
                { new: true }
            );

            if (!updatedBank) {
                return createErrorResponse(
                    'Failed to update bank account status',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Update operation failed'
                );
            }

            return successResponse(
                "Bank account status updated successfully",
                StatusCodes.OK,
                {
                    message: 'Bank account status updated',
                    status: newStatus,
                    bankId: updatedBank._id,
                    updatedAt: updateTime
                }
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error toggling bank account status',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewBankRepository(db: any): BankDomainRepository {
    return new BankRepository(db);
}