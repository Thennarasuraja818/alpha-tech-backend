import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/commonResponse";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { ExpenseTypeDomainRepository, ExpenseTypeDomainService, ExpenseTypeListParams } from "../../../domain/admin/expense.typeDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import { CreateExpenseTypeInput, UpdateExpenseTypeInput } from "../../../api/Request/expense.type";

class ExpenseTypeServices implements ExpenseTypeDomainService {
    private readonly expenseTypeRepo: ExpenseTypeDomainRepository;

    constructor(repo: ExpenseTypeDomainRepository) {
        this.expenseTypeRepo = repo;
    }
    
    async createExpenseType(input: CreateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.expenseTypeRepo.createExpenseType(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating expense type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    
    async updateExpensetype(input: UpdateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.expenseTypeRepo.updateExpensetype(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error update expense type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    
    async getExpensetypeById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            return await this.expenseTypeRepo.getExpensetypeById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error finding expense type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    
    async getExpenseTypeList(params: ExpenseTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse> {
        try {
            return await this.expenseTypeRepo.getExpenseTypeList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error finding expense types',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteExpenseType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.expenseTypeRepo.deleteExpenseType(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error delete expense type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewExpenseTypeServiceRegister(repo: ExpenseTypeDomainRepository): ExpenseTypeDomainService {
    return new ExpenseTypeServices(repo);
}