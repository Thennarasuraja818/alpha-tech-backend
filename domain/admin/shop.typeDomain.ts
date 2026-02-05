
import { CreateShopTypeInput, UpdateShopTypeInput } from "../../api/Request/shop.type";
import { ApiResponse, ErrorResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface ShopTypeListParams {
    page: number;
    limit: number;
    search: string;
}

export interface ShopTypeDomainRepository {
    createShopeType(input: CreateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateShoptype(input: UpdateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getShoptypeById(id: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getShopTypeList(params: ShopTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse>;
    deleteShopType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface ShopTypeDomainService {
    createShopeType(input: CreateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateShoptype(input: UpdateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getShoptypeById(id: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getShopTypeList(params: ShopTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse>;
    deleteShopType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;

}
