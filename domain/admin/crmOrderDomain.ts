import { ApiResponse, ErrorResponse, SuccessMessage } from '../../api/response/commonResponse';
import { CreateOrderInput, UpdateOrderInput } from '../../api/Request/order';
import { OrderDocument } from '../../app/model/order';
import { PaginationResult } from "../../api/response/paginationResponse";
import { ProductDocument } from '../../api/response/product.response';
import { RootListParams } from '../admin/root.Domain';
import { RootDocumentResponse } from '../../api/response/root.response';

export interface CrmOrderDomainRepository {
    create(input: CreateOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, input: UpdateOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateStatus(id: string, amount: number, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    list(params: {
        page: number; limit: number, type: string, userId: string, orderStatus: string,
        paymentStatus?: string,
        dateFilter?: string, startDate?: string, endDate?: string,orderCode?: string
    }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getById(id: string): Promise<ApiResponse<OrderDocument> | ErrorResponse>;
    topSellingProduct(params: { type: string }): Promise<ApiResponse<ProductDocument[]> | ErrorResponse>;
    lineManOrderList(params: {
        page: number; limit: number, type: string, userId: string,
        status: string, dateFilter?: string, startDate?: string, endDate?: string
    }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse>;
    updateOrderStatus(id: string, status: string, userId: string, reason: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  }

export interface CrmOrderDomainService {
    create(input: CreateOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, input: UpdateOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateStatus(id: string, amount: number, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    list(params: {
        page: number; limit: number, type: string, userId: string, orderStatus: string,
        paymentStatus?: string, dateFilter?: string, startDate?: string, endDate?: string, orderCode?: string, search?: string
    }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getById(id: string): Promise<ApiResponse<OrderDocument> | ErrorResponse>;
    topSellingProduct(params: { type: string }): Promise<ApiResponse<ProductDocument[]> | ErrorResponse>;
    lineManOrderList(params: {
        page: number; limit: number, type: string, userId: string,
        status: string, dateFilter?: string, startDate?: string, endDate?: string
    }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse>;
    updateOrderStatus(id: string, status: string, userId: string, reason: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
   
}