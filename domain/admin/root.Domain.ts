import { CreateCustomerVariant, UpdateCustomerVariantRetailer } from "../../api/Request/customer.variant";
import { CreateRootInput, UpdateRootInput } from "../../api/Request/root";
import { ApiResponse, ErrorResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { RootDocumentResponse } from "../../api/response/root.response";

export interface RootListParams {
    page: number;
    limit: number;
    search: string;
    pincode: string;
}

export interface RootDomainRepository {
    findRootIsExist(id: string): Promise<Boolean | ErrorResponse>
    createRoute(input: CreateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateRoue(input: UpdateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getRouteById(id: string): Promise<ApiResponse<RootDocumentResponse> | ErrorResponse>;
    getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse>;
    deleteRoot(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    createCustomerVariant(input: CreateCustomerVariant, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    customerVariantList(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateCustomerVariantForCustomer(input: UpdateCustomerVariantRetailer, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface RootDomainService {
    createRoute(input: CreateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateRoue(input: UpdateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getRouteById(id: string): Promise<ApiResponse<RootDocumentResponse> | ErrorResponse>;
    getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse>;
    deleteRoot(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    createCustomerVariant(input: CreateCustomerVariant, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    customerVariantList(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateCustomerVariantForCustomer(input: UpdateCustomerVariantRetailer, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;

}
