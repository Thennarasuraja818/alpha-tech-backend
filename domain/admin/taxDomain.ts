import { CreateTaxInput, UpdateTaxInput } from "../../api/Request/tax";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface TaxListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    taxType?: string;
}

export interface TaxDomainRepository {
    findTaxNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createTax(taxInput: CreateTaxInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateTax(taxInput: UpdateTaxInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findTaxId(id: string): Promise<Boolean | ErrorResponse>;
    findTaxNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findTaxById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getTaxList(params: TaxListParams): Promise<PaginationResult<any> | ErrorResponse>;
    findTaxInUsage(id: string): Promise<Boolean | ErrorResponse>;
    deleteTax(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    toggleTaxStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface TaxDomainService extends TaxDomainRepository {}