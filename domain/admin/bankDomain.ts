import { CreateBankInput, UpdateBankInput } from "../../api/Request/bank";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface BankListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    status?: 'active' | 'inactive';
}

export interface BankDomainRepository {
    findBankAccountNumberExist(accountNumber: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createBank(bankInput: CreateBankInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateBank(bankInput: UpdateBankInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findBankId(id: string): Promise<boolean | ErrorResponse>;
    findBankAccountNumberForUpdate(accountNumber: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findBankById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getBankList(params: BankListParams): Promise<PaginationResult<any> | ErrorResponse>;
    findBankInUsage(id: string): Promise<boolean | ErrorResponse>;
    deleteBank(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    toggleBankStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface BankDomainService extends BankDomainRepository {}