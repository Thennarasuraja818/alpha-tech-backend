import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { PaginationResult } from "../../api/response/paginationResponse";
import { ProductInput, UpdateProductInput } from "../../api/Request/product";
import { ProductDocument } from "../../api/response/product.response";

export interface ProductListParams {
    offset: number;
    limit: number;
    search: string;
    order: 'asc' | 'desc';
    categoryId: string;
    subCategoryId: string;
    sortBy: string;
    type: string;
    page: number,
    id: string,
    priceFromRange: string,
    priceToRange: string,
    orderId: string,
    userId: string,
    fromDate: string,
    toDate: string,
    orderType: string,
    childCategoryId: string;
    ratingFrom: string;
    ratingTo: string;
}

export interface ProductDomainRepository {
    create(product: ProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, product: UpdateProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getProductByCategoryId(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse>;
    getById(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse>;
    list(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;
    findSlugExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findProductNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findSlugExistForEdit(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findTopRatedProduct(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;
}

export interface ProductDomainService {
    create(product: ProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, product: UpdateProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getById(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse>;
    list(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;
    findTopRatedProduct(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse>;
    getProductByCategoryId(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse>;

}
