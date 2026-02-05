import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { CreateBoxCashManagementInput, UpdateBoxCashManagementInput } from "../../api/Request/boxCashManagement";
import { IBoxCashManagement } from "../../app/model/boxCashManagement";

export interface BoxCashManagementParams {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IBoxCashManagementRepository {
  createBoxCashManagement(data: CreateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
  getBoxCashManagementById(id: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
  getAllBoxCashManagement(params: BoxCashManagementParams): Promise<PaginationResult<IBoxCashManagement> | ErrorResponse>;
  updateBoxCashManagement(id: string, data: UpdateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
  deleteBoxCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  getBoxCashManagementByDate(date: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
}

export interface BoxCashManagementServiceDomain {
  createBoxCashManagement(data: CreateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
  getBoxCashManagementById(id: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
  getAllBoxCashManagement(params: BoxCashManagementParams): Promise<PaginationResult<IBoxCashManagement> | ErrorResponse>;
  updateBoxCashManagement(id: string, data: UpdateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
  deleteBoxCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse>;
  getBoxCashManagementByDate(date: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse>;
}