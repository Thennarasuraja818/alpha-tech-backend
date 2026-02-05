// domain/admin/boxCashDomain.ts
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse } from "../../api/response/commonResponse";
import { IBoxCash } from "../../app/model/BoxcashModel";
import { PaginationResult } from "../../api/response/paginationResponse";
import { CreateBoxCashInput, UpdateBoxCashInput } from "../../api/Request/boxCash";

export interface BoxCashParams {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  userType?: string;
}

export interface IBoxCashRepository {
  createTransaction(data: CreateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse>;
  getTransactionById(id: string): Promise<ApiResponse<IBoxCash> | ErrorResponse>;
  getAllTransactions(params: BoxCashParams): Promise<PaginationResult<IBoxCash> | ErrorResponse>;
  updateTransaction(id: string, data: UpdateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse>;
  deleteTransaction(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  getDailySummary(params: BoxCashParams): Promise<PaginationResult<IBoxCash> | ErrorResponse>;
}

export interface BoxCashServiceDomain {
  createTransaction(data: CreateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse>;
  getTransactionById(id: string): Promise<ApiResponse<IBoxCash> | ErrorResponse>;
  getAllTransactions(params: BoxCashParams): Promise<PaginationResult<IBoxCash> | ErrorResponse>;
  updateTransaction(id: string, data: UpdateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse>;
  deleteTransaction(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  getDailySummary(params: BoxCashParams): Promise<PaginationResult<IBoxCash> | ErrorResponse>;
}