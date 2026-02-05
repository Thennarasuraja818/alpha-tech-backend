// app/service/admin/boxCash.service.ts
import { IBoxCashRepository, BoxCashParams, BoxCashServiceDomain } from "../../../domain/admin/boxCashDomain";
import { CreateBoxCashInput, UpdateBoxCashInput } from "../../../api/Request/boxCash";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { StatusCodes } from "http-status-codes";
import { PaginationResult } from "../../../api/response/paginationResponse";

export class BoxCashService implements BoxCashServiceDomain {
  constructor(private repository: IBoxCashRepository) {}

  async createTransaction(data: CreateBoxCashInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.createTransaction(data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to create transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getTransactionById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.getTransactionById(id);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAllTransactions(params: BoxCashParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getAllTransactions(params);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transactions",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateTransaction(id: string, data: UpdateBoxCashInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.updateTransaction(id, data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to update transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async deleteTransaction(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      return await this.repository.deleteTransaction(id);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to delete transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getDailySummary(params: BoxCashParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getDailySummary(params);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transactions summary",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export function boxCashServiceFactory(repository: IBoxCashRepository): BoxCashServiceDomain {
  return new BoxCashService(repository);
}