import {
  IWholesaleOrderRepository,
  WholesaleOrderParams,
  WholesaleOrderServiceDomain,
} from "../../../domain/admin/wholesaleOrderDomain";
import {
  CreateWholesaleOrderInput,
  UpdateWholesaleOrderInput,
} from "../../../api/Request/wholesaleOrder";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { IWholesaleOrder } from "../../model/wholesaleOrder";
import { OrderDocument, } from "../../model/order";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { StatusCodes } from "http-status-codes";
import { CreditAmountDetails, OrderWholesalerDetails } from "../../../api/response/wholesaler.order.response";

export class WholesaleOrderService implements WholesaleOrderServiceDomain {
  private repo: IWholesaleOrderRepository;
  constructor(repo: IWholesaleOrderRepository) {
    this.repo = repo;
  }
  async findCreditOrderDetailsForPaymentDue(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse> {
    try {
      return await this.repo.findCreditOrderDetailsForPaymentDue(params);
    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving order of wholesaler',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findCreditOrderDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse> {
    try {
      return await this.repo.findCreditOrderDetails(params);
    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving order of wholesaler',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findCreditDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse> {
    try {
      return await this.repo.findCreditDetails(params);
    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving order of wholesaler',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findOrderOfWholesaler(params: WholesaleOrderParams): Promise<PaginationResult<OrderWholesalerDetails> | ErrorResponse> {
    try {
      return await this.repo.findOrderOfWholesaler(params);
    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving order of wholesaler',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async updateOrderStatus(id: string, status: string, userId: string, paymentStatus: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const isExist = await this.repo.findIsOrderExist(id);

      if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
        return isExist as ErrorResponse;
      }

      if (!isExist) {
        return createErrorResponse(
          'Order not found',
          StatusCodes.BAD_REQUEST,
          'Error order not found');
      }

      return await this.repo.updateOrderStatus(id, status, userId, paymentStatus)

    } catch (error: any) {
      return createErrorResponse(
        'Error updating order',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  createOrder(
    data: CreateWholesaleOrderInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    return this.repo.createOrder(data);
  }

  getOrderById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
    return this.repo.getOrderById(id);
  }
  async approvedUpdateOrderStatus(
    id: string,
    status: string,
    userId: string,
    reason?: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const isExist = await this.repo.findIsOrderExist(id);

      if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
        return isExist as ErrorResponse;
      }

      if (!isExist) {
        return createErrorResponse(
          'Order not found',
          StatusCodes.BAD_REQUEST,
          'Error order not found'
        );
      }
      return await this.repo.approvedUpdateOrderStatus(id, status, userId, reason);
    } catch (error: any) {
      return createErrorResponse(
        'Error updating order',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  getAllWholeSaleorders(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<
    | ApiResponse<{
      items: IWholesaleOrder[];
      total: number;
      limit: number;
      offset: number;
    }>
    | ErrorResponse
  > {
    return this.repo.getAllWholeSaleorders(options);
  }

  updateOrder(
    id: string,
    data: UpdateWholesaleOrderInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    return this.repo.updateOrder(id, data);
  }

  deleteOrder(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    return this.repo.deleteOrder(id);
  }
  orderlists(params: { page: number; limit: number, type: string, userId: string, orderType: string, orderCode: string, format: string }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
    return this.repo.orderlists(params);
  }
  deliveryList(params: {
    page: number;
    limit: number;
    type: string;
    userId: string;
    orderType: string;
    status?: string;
  }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
    return this.repo.deliveryList(params);
  }
  deliverymanPerformanceList(params: {
    page: number;
    limit: number;
    fromDate: string;
    toDate: string;
  }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
    return this.repo.deliverymanPerformanceList(params);
  }
  deliverymanTopPerformanceList(params: {
    page: number;
    limit: number;
    fromDate: string;
    toDate: string;
  }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
    return this.repo.deliverymanTopPerformanceList(params);
  }
  failedDeliveryList(params: {
    page: number;
    limit: number;
    fromDate: string;
    toDate: string;
  }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
    return this.repo.failedDeliveryList(params);
  }
  async updatePayment(params: {
    orderId: string;
    amountPaid: number;
    paymentMode: string;
    userId: string;
  }): Promise<ApiResponse<any> | ErrorResponse> {
    return this.repo.updatePayment(params);
  }

  orderDetails(orderId: string): Promise<ApiResponse<any> | ErrorResponse> {
    return this.repo.orderDetails(orderId);
  }
  orderDetailsByInvoiceId(orderId: string): Promise<ApiResponse<any> | ErrorResponse> {
    return this.repo.orderDetailsByInvoiceId(orderId);
  }
  returnOrderList(params: any): Promise<PaginationResult<any> | ErrorResponse> {
    return this.repo.returnOrderList(params);
  }
  async updateReturnOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const isExist = await this.repo.findIsOrderExist(id);

      if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
        return isExist as ErrorResponse;
      }

      if (!isExist) {
        return createErrorResponse(
          'Order not found',
          StatusCodes.BAD_REQUEST,
          'Error order not found');
      }

      return await this.repo.updateReturnOrderStatus(id, status, userId)

    } catch (error: any) {
      return createErrorResponse(
        'Error updating order',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  topWholesalerOrder(params: any): Promise<PaginationResult<any> | ErrorResponse> {
    return this.repo.topWholesalerOrder(params);
  }
}

export function wholesaleOrderServiceFun(
  repo: IWholesaleOrderRepository
): WholesaleOrderServiceDomain {
  return new WholesaleOrderService(repo);
}
