import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse } from "../../api/response/commonResponse";
import { IPettyCash } from "../../app/model/pettyCash";
import { PaginationResult } from "../../api/response/paginationResponse";
import { CreatePettyCashInput, UpdatePettyCashInput } from "../../api/Request/pettyCash";

export interface PettyCashParams {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  paymentMode?: string;
}

export interface IPettyCashRepository {
  createTransaction(data: CreatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse>;
  getTransactionById(id: string): Promise<ApiResponse<IPettyCash> | ErrorResponse>;
  getAllTransactions(params: PettyCashParams, userId: string): Promise<PaginationResult<IPettyCash> | ErrorResponse>;
  updateTransaction(id: string, data: UpdatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse>;
  deleteTransaction(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  getDailySummary(params: PettyCashParams,userId:string): Promise<PaginationResult<IPettyCash> | ErrorResponse>;
}

export interface PettyCashServiceDomain {
  createTransaction(data: CreatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse>;
  getTransactionById(id: string): Promise<ApiResponse<IPettyCash> | ErrorResponse>;
  getAllTransactions(params: PettyCashParams, userId: string): Promise<PaginationResult<IPettyCash> | ErrorResponse>;
  updateTransaction(id: string, data: UpdatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse>;
  deleteTransaction(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  getDailySummary(params: PettyCashParams,userId:string): Promise<PaginationResult<IPettyCash> | ErrorResponse>;
}
