import { CreateBrandInput, UpdateBrandInput } from "../../api/Request/brand"
import { Brand, BrandDtls } from "../../api/response/brand.response"
import { ErrorResponse } from "../../api/response/cmmonerror"
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse"
import { PaginationResult } from "../../api/response/paginationResponse";

export interface BrandListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    type:string
}

export interface BrandDomainRepository {
    findBrandNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createBrand(brandInput: CreateBrandInput, logo:any, userId: string): Promise<ApiResponse<Brand> | ErrorResponse>;
    updateBrand(brandInput: UpdateBrandInput, logo:any, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findBrandId(id: string): Promise<Boolean | ErrorResponse>;
    findBrandNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findBrandById(id: string): Promise<ApiResponse<BrandDtls> | ErrorResponse>;
    getBrandList(params: BrandListParams): Promise<PaginationResult<BrandDtls> | ErrorResponse>;
    findBrandInProduct(id:string): Promise<Boolean | ErrorResponse>;
    deleteBrand(id:string, userId:string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    
}

export interface BrandDomainService {
    createBrand(brandInput: CreateBrandInput, logo: any, userId: string): Promise<ApiResponse<Brand> | ErrorResponse>;
    updateBrand(brandInput: UpdateBrandInput, logo:any, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findBrandById(id: string): Promise<ApiResponse<BrandDtls> | ErrorResponse>;
    getBrandList(params: BrandListParams): Promise<PaginationResult<BrandDtls> | ErrorResponse>;
    deleteBrand(id:string, userId:string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    
}