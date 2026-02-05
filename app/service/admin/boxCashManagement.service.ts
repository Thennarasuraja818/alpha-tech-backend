import { IBoxCashManagementRepository, BoxCashManagementParams, BoxCashManagementServiceDomain } from "../../../domain/admin/boxCashManagementDomain";
import { CreateBoxCashManagementInput, UpdateBoxCashManagementInput } from "../../../api/Request/boxCashManagement";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { StatusCodes } from "http-status-codes";
import { PaginationResult } from "../../../api/response/paginationResponse";

export class BoxCashManagementService implements BoxCashManagementServiceDomain {
  constructor(private repository: IBoxCashManagementRepository) {}

  async createBoxCashManagement(data: CreateBoxCashManagementInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.createBoxCashManagement(data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to create box cash management record",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getBoxCashManagementById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.getBoxCashManagementById(id);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch box cash management record",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAllBoxCashManagement(params: BoxCashManagementParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      return await this.repository.getAllBoxCashManagement(params);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch box cash management records",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateBoxCashManagement(id: string, data: UpdateBoxCashManagementInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.updateBoxCashManagement(id, data, userId);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to update box cash management record",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async deleteBoxCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      return await this.repository.deleteBoxCashManagement(id);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to delete box cash management record",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getBoxCashManagementByDate(date: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      return await this.repository.getBoxCashManagementByDate(date);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch box cash management record by date",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export function boxCashManagementServiceFactory(repository: IBoxCashManagementRepository): BoxCashManagementServiceDomain {
  return new BoxCashManagementService(repository);
}