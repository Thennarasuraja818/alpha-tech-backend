import { CreateExpenseTypeInput, UpdateExpenseTypeInput } from "../../api/Request/expense.type";
import { ApiResponse, ErrorResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface ExpenseTypeListParams {
    page: number;
    limit: number;
    search: string;
}

export interface ExpenseTypeDomainRepository {
    createExpenseType(input: CreateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateExpensetype(input: UpdateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getExpensetypeById(id: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getExpenseTypeList(params: ExpenseTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse>;
    deleteExpenseType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface ExpenseTypeDomainService {
    createExpenseType(input: CreateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateExpensetype(input: UpdateExpenseTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getExpensetypeById(id: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getExpenseTypeList(params: ExpenseTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse>;
    deleteExpenseType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}