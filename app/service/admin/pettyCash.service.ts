import { IPettyCashRepository, PettyCashParams, PettyCashServiceDomain } from "../../../domain/admin/pettyCashDomain";
import { CreatePettyCashInput, UpdatePettyCashInput } from "../../../api/Request/pettyCash";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { StatusCodes } from "http-status-codes";
import { PaginationResult } from "../../../api/response/paginationResponse";

export class PettyCashService implements PettyCashServiceDomain {
  constructor(private repository: IPettyCashRepository) { }

  async createTransaction(data: CreatePettyCashInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
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

  async getAllTransactions(params: PettyCashParams, userId: string): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getAllTransactions(params, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transactions",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateTransaction(id: string, data: UpdatePettyCashInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
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

  async getDailySummary(params: PettyCashParams, userId: string): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getAllTransactions(params, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transactions",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export function pettyCashServiceFactory(repository: IPettyCashRepository): PettyCashServiceDomain {
  return new PettyCashService(repository);
}
