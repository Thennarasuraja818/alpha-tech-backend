import {
  CreatePettyCashManagementInput,
  UpdatePettyCashManagementInput
} from "../../../api/Request/pettyCashManagement";

import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { StatusCodes } from "http-status-codes";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { IPettyCashManagementRepository, PettyCashManagementParams, PettyCashManagementServiceDomain } from "../../../domain/admin/pettyCashManagementDomain";

export class PettyCashManagementService implements PettyCashManagementServiceDomain {
  constructor(private repository: IPettyCashManagementRepository) { }

  async createPettyCashManagement(data: CreatePettyCashManagementInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.createPettyCashManagement(data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to create petty cash management",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getPettyCashManagementById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.getPettyCashManagementById(id);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch petty cash shift",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAllPettyCashManagement(params: PettyCashManagementParams, userId: string): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getAllPettyCashManagement(params, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch all petty cash shifts",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updatePettyCashManagement(id: string, data: UpdatePettyCashManagementInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.updatePettyCashManagement(id, data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to update petty cash shift",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updatePettyCashManagementForAdmin(id: string, data: UpdatePettyCashManagementInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.updatePettyCashManagementForAdmin(id, data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to update petty cash shift",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async deletePettyCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      return await this.repository.deletePettyCashManagement(id);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to delete petty cash shift",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getDailyPettyCashManagementSummary(params: PettyCashManagementParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getDailyPettyCashManagementSummary(params);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch daily summary",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export function pettyCashManagementServiceFactory(
  repository: IPettyCashManagementRepository
): PettyCashManagementServiceDomain {
  return new PettyCashManagementService(repository);
}
