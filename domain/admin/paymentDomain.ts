import { ErrorResponse } from "../../api/response/cmmonerror";
import { PaginationResult } from "../../api/response/paginationResponse";
import { OrderDocument } from "../../app/model/order";

export interface PaymentParams {
    page: number;
    limit: number;
    search: string;
    id: string,
    type: string
}

export interface IPaymentRepository {
    orderlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    unpaidorderlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    dailypaymentlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}

export interface PaymentServiceDomain {
    orderlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    unpaidorderlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
    dailypaymentlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
}
