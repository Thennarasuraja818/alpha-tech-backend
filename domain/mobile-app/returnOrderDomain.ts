import { ApiResponse, ErrorResponse, SuccessMessage } from '../../api/response/commonResponse';
import { OrderDocument } from '../../app/model/order';
import { PaginationResult } from "../../api/response/paginationResponse";
import { CreateReturnOrderInput, UpdateReturnOrderInput } from '../../api/Request/return.order';

export interface ReturnOrderDomainRepository {
    create(input: CreateReturnOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, input: UpdateReturnOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    list(params: { page: number; limit: number, type: string, userId: string }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getReturnExchangeList(params: { page: number; limit: number, type: string, userId: string, status?: string, dateFilter?: string, startDate?: string, endDate?: string, }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}

export interface ReturnOrderDomainService {
    create(input: CreateReturnOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, input: UpdateReturnOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    list(params: { page: number; limit: number, type: string, userId: string }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getReturnExchangeList(params: { page: number; limit: number, type: string, userId: string, status?: string, dateFilter?: string, startDate?: string, endDate?: string, }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}