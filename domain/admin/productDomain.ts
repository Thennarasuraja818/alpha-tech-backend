import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { PaginationResult } from "../../api/response/paginationResponse";
import { ProductInput, UpdateProductInput } from "../../api/Request/product";
import { ProductDocument } from "../../api/response/product.response";

export interface ProductListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    type: string;
    categoryId: string;
    userId: string
    orderId: string
    offerType: string,
    stockType: string
}

export interface ProductDomainRepository {
    create(product: ProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, product: UpdateProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getCurrentStock(): Promise<ApiResponse<ProductDocument[]> | ErrorResponse>;
    getById(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse>;
    list(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;
    findSlugExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findProductNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findSlugExistForEdit(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findIsProductExist(id: string): Promise<Boolean | ErrorResponse>;
    delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>
    activeList(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;

}

export interface ProductDomainService {
    create(product: ProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, product: UpdateProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getCurrentStock(): Promise<ApiResponse<ProductDocument[]> | ErrorResponse>;
    getById(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse>;
    list(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;
    delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>
    activeList(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;

}
