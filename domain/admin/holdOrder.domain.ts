import { ApiResponse, ErrorResponse, SuccessMessage } from '../../api/response/commonResponse';
import { CreateOrderInput, UpdateOrderInput } from '../../api/Request/order';
import { OrderDocument } from '../../app/model/order';
import { PaginationResult } from "../../api/response/paginationResponse";

export interface HoldOrderDomainRepository {
    create(input: CreateOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    update(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    list(params: {
        page: number; limit: number, type: string, userId: string, orderStatus: string,
        paymentStatus?: string, dateFilter?: string, startDate?: string, endDate?: string, holdOrderId?: string, orderFrom?: string
    }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}

export interface HoldOrderDomainService {
    create(input: CreateOrderInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    update(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    list(params: {
        page: number; limit: number, type: string, userId: string, orderStatus: string,
        paymentStatus?: string, dateFilter?: string, startDate?: string, endDate?: string, holdOrderId?: string, orderFrom?: string
    }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}