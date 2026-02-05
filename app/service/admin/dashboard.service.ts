import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { DashboardDomainRepository, DashboardDomainService } from "../../../domain/admin/dashboard.domain";

export class DashboardService implements DashboardDomainService {
  private readonly repo: DashboardDomainRepository;

  constructor(repo: DashboardDomainRepository) {
    this.repo = repo;
  }

  async getRecentCustomer(): Promise<PaginationResult<any[]> | ErrorResponse> {
    try {
      return await this.repo.getRecentCustomer();
    } catch (error: any) {
      return createErrorResponse(
        'Error fetching recent customer',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
}
    async topSellingProduct(params: any): Promise<ApiResponse<any[]> | ErrorResponse> {
        try {
            return await this.repo.topSellingProduct(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error fetching top selling product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getSalesOverview(params: any): Promise<ApiResponse<any> | ErrorResponse> {
        try {
          const result = await this.repo.getSalesOverview(params);
    
          return result
        } catch (error: any) {
          return createErrorResponse(
            'Error fetching sales overview',
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
          );
        }
      }
      async getSalesOverviewByMonth(params: any): Promise<ApiResponse<any> | ErrorResponse> {
        try {
          return await this.repo.getSalesOverviewByMonth(params);
        } catch (error: any) {
          return createErrorResponse(
            'Error fetching sales overview',
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
          );
        }
      }
      async getPaidOrdersList(params: any): Promise<ApiResponse<any> | ErrorResponse> {
        try {
          return await this.repo.getPaidOrdersList(params);
        } catch (error: any) {
          return createErrorResponse(
            'Error fetching sales overview',
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
          );
        }
      }
}

export function NewDashboardService(repo: DashboardDomainRepository): DashboardDomainService {
  return new DashboardService(repo);
}