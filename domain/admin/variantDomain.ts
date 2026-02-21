import { CreateVariantInput, UpdateVariantInput, VariantListParams } from "../../api/Request/variant";
import { Variant, VariantDtls } from "../../api/response/variant.response";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface VariantDomainRepository {
    findVariantNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createVariant(variantInput: CreateVariantInput, userId: string): Promise<ApiResponse<Variant> | ErrorResponse>;
    updateVariant(variantInput: UpdateVariantInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findVariantId(id: string): Promise<Boolean | ErrorResponse>;
    findVariantNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findVariantById(id: string): Promise<ApiResponse<VariantDtls> | ErrorResponse>;
    getVariantList(params: VariantListParams): Promise<PaginationResult<VariantDtls> | ErrorResponse>;
    deleteVariant(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>
}

export interface VariantDomainService {
    createVariant(variantInput: CreateVariantInput, userId: string): Promise<ApiResponse<Variant> | ErrorResponse>;
    updateVariant(variantInput: UpdateVariantInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findVariantById(id: string): Promise<ApiResponse<VariantDtls> | ErrorResponse>;
    getVariantList(params: VariantListParams): Promise<PaginationResult<VariantDtls> | ErrorResponse>;
    deleteVariant(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>
}
