import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import {
  CreatePettyCashManagementInput,
  UpdatePettyCashManagementInput,
} from "../../api/Request/pettyCashManagement";
import { IPettyCashManagement } from "../../app/model/pettyCash.management";

export interface PettyCashManagementParams {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IPettyCashManagementRepository {
  createPettyCashManagement(
    data: CreatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;

  getPettyCashManagementById(
    id: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;

  getAllPettyCashManagement(
    params: PettyCashManagementParams,
    userId: string
  ): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse>;

  updatePettyCashManagement(
    id: string,
    data: UpdatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;

  updatePettyCashManagementForAdmin(
    id: string,
    data: UpdatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;

  deletePettyCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse>;

  getDailyPettyCashManagementSummary(
    params: PettyCashManagementParams
  ): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse>;
}

export interface PettyCashManagementServiceDomain {
  createPettyCashManagement(
    data: CreatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;

  getPettyCashManagementById(
    id: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;

  getAllPettyCashManagement(
    params: PettyCashManagementParams,
    userId: string

  ): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse>;

  updatePettyCashManagement(
    id: string,
    data: UpdatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;
  
  updatePettyCashManagementForAdmin(
    id: string,
    data: UpdatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse>;


  deletePettyCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse>;

  getDailyPettyCashManagementSummary(
    params: PettyCashManagementParams
  ): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse>;
}
