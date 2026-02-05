import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import Users from "../../app/model/user";
import { CreateCustomerInput } from "../../api/Request/customer";
import { CreateOrderInput } from "../../api/Request/order";
export interface IPosRepository {
    createCustomer(data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse>;
    createOrder(data: CreateOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    getCustomerById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getAllCustomers(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
    }): Promise<ApiResponse<{ items: []; total: number; limit: number; offset: number }> | ErrorResponse>;
    updateCustomer(id: string, data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse>;
    deleteCustomer(id: string, userId: string): Promise<ApiResponse<null> | ErrorResponse>;
}

export interface PosServiceDomain {
    createOrder(data: CreateOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    createCustomer(data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse>;
    getCustomerById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getAllCustomers(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
    }): Promise<ApiResponse<{ items: []; total: number; limit: number; offset: number }> | ErrorResponse>;
    updateCustomer(id: string, data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse>;
    deleteCustomer(id: string, userId: string): Promise<ApiResponse<null> | ErrorResponse>;
}
