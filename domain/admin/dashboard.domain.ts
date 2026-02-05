import { ApiResponse, ErrorResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { ProductDocument } from "../../api/response/product.response";

export interface DashboardListParams {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
}

export interface DashboardDomainRepository {
    getRecentCustomer(): Promise<PaginationResult<any[]> | ErrorResponse>;
    topSellingProduct(params: any): Promise<ApiResponse<any[]> | ErrorResponse>;
    getSalesOverview(params: any): Promise<ApiResponse<any> | ErrorResponse>;
    getSalesOverviewByMonth(params: any): Promise<ApiResponse<any> | ErrorResponse>;
    getPaidOrdersList(params: any): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface DashboardDomainService {
    getRecentCustomer(): Promise<PaginationResult<any[]> | ErrorResponse>;
    topSellingProduct(params: any): Promise<ApiResponse<any[]> | ErrorResponse>;
    getSalesOverview(params: any): Promise<ApiResponse<any> | ErrorResponse>;
    getSalesOverviewByMonth(params: any): Promise<ApiResponse<any> | ErrorResponse>;
    getPaidOrdersList(params: any): Promise<ApiResponse<any> | ErrorResponse>;
}