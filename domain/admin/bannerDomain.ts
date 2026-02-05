import { CreateBannerInput, UpdateBannerInput } from "../../api/Request/Banner";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface BannerListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    type:string
}

export interface BannerDomainRepository {
    findBannerNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createBanner(BannerInput: CreateBannerInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateBanner(BannerInput: UpdateBannerInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findBannerId(id: string): Promise<Boolean | ErrorResponse>;
    findBannerNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findBannerById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getBannerList(params: BannerListParams): Promise<PaginationResult<any> | ErrorResponse>;
    findBannerInProduct(id:string): Promise<Boolean | ErrorResponse>;
    deleteBanner(id: string, userId:string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> 
    
}

export interface BannerDomainService {
    findBannerNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createBanner(BannerInput: CreateBannerInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateBanner(BannerInput: UpdateBannerInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findBannerId(id: string): Promise<Boolean | ErrorResponse>;
    findBannerNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findBannerById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getBannerList(params: BannerListParams): Promise<PaginationResult<any> | ErrorResponse>;
    findBannerInProduct(id:string): Promise<Boolean | ErrorResponse>;
    deleteBanner(id: string, userId:string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> 
}
