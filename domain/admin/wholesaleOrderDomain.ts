import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { IWholesaleOrder } from "../../app/model/wholesaleOrder";
import { CreateWholesaleOrderInput, UpdateWholesaleOrderInput } from "../../api/Request/wholesaleOrder";
import { PaginationResult } from "../../api/response/paginationResponse";
import { OrderDocument } from "../../app/model/order";
import { CreditAmountDetails, OrderWholesalerDetails } from "../../api/response/wholesaler.order.response";

export interface WholesaleOrderParams {
  page: number;
  limit: number;
  search: string;
  id: string,
  type: string,
  format?: string
}


export interface IWholesaleOrderRepository {
  createOrder(data: CreateWholesaleOrderInput): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse>;
  getOrderById(id: string): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse>;
  getAllWholeSaleorders(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    type?: string

  }): Promise<ApiResponse<{ items: IWholesaleOrder[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateOrder(id: string, data: UpdateWholesaleOrderInput): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse>;
  deleteOrder(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  approvedUpdateOrderStatus(
    id: string,
    status: string,
    userId: string,
    reason?: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  orderlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  deliveryList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  deliverymanPerformanceList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  deliverymanTopPerformanceList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  failedDeliveryList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  orderDetails(orderId: string): Promise<ApiResponse<any> | ErrorResponse>;
  orderDetailsByInvoiceId(orderId: string): Promise<ApiResponse<any> | ErrorResponse>;

  updatePayment(params: {
    orderId: string;
    amountPaid: number;
    paymentMode: string;
    userId: string;
  }): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  updateOrderStatus(id: string, status: string, userId: string, paymentStatus: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  findIsOrderExist(id: string): Promise<Boolean | ErrorResponse>;
  findOrderOfWholesaler(params: WholesaleOrderParams): Promise<PaginationResult<OrderWholesalerDetails> | ErrorResponse>;
  returnOrderList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  updateReturnOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;

  findCreditDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse>
  findCreditOrderDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse>
  findCreditOrderDetailsForPaymentDue(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse>
  topWholesalerOrder(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}

export interface WholesaleOrderServiceDomain {
  createOrder(data: CreateWholesaleOrderInput): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse>;
  getOrderById(id: string): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse>;
  getAllWholeSaleorders(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    type?: string
  }): Promise<ApiResponse<{ items: IWholesaleOrder[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  approvedUpdateOrderStatus(
    id: string,
    status: string,
    userId: string,
    reason?: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  updateOrder(id: string, data: UpdateWholesaleOrderInput): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse>;
  deleteOrder(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  deliveryList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  deliverymanPerformanceList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  deliverymanTopPerformanceList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  failedDeliveryList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  orderlists(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  orderDetails(orderId: string): Promise<ApiResponse<any> | ErrorResponse>;
  orderDetailsByInvoiceId(orderId: string): Promise<ApiResponse<any> | ErrorResponse>;

  updateOrderStatus(id: string, status: string, userId: string, paymentStatus: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  findOrderOfWholesaler(params: WholesaleOrderParams): Promise<PaginationResult<OrderWholesalerDetails> | ErrorResponse>;
  updatePayment(params: {
    orderId: string;
    amountPaid: number;
    paymentMode: string;
    userId: string;
  }): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  returnOrderList(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
  updateReturnOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;

  findCreditDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse>
  findCreditOrderDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse>
  findCreditOrderDetailsForPaymentDue(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse>
  topWholesalerOrder(params: any): Promise<PaginationResult<OrderDocument> | ErrorResponse>;

}
