import { PaginationResult } from '../../api/response/paginationResponse';
import { ErrorResponse } from '../../api/response/cmmonerror';
import { UpdateCashsettlementtInput } from '../../api/Request/salesAndTargets';

export interface CreateSalesTargetInput {
  salemanId: any;
  targetSalesAmount: number;
  targetPeriod: 'Monthly' | 'Quarterly' | 'Yearly';
  incentiveAmount?: number;
  status?: 'Achieved' | 'Not Achieved' | 'Exceeded';
}

export interface UpdateSalesTargetInput {
  salemanId?: any;
  targetSalesAmount?: number;
  targetPeriod?: 'Monthly' | 'Quarterly' | 'Yearly';
  incentiveAmount?: number;
  status?: 'Achieved' | 'Not Achieved' | 'Exceeded';
  isActive?: boolean;
  isDelete?: boolean;
}

export interface SalesTargetListParams {
  search?: string;
  status?: string;
  targetPeriod?: string;
  salemanId?: any
  page: number;
  limit: number;
}

export interface SalesTargetDomainRepository {
  createSalesTarget(input: CreateSalesTargetInput, userId: string): Promise<any>;
  findSalesTargetExists(id: string): Promise<boolean>;
  updateSalesTarget(id: string, input: UpdateSalesTargetInput, userId: string): Promise<any>;
  deleteSalesTarget(id: string, userId: string): Promise<any>;
  listSalesTargets(params: SalesTargetListParams): Promise<any>;
  listAchievedSalesTargets(params: SalesTargetListParams): Promise<any>;
  getSalesTargetById(id: string): Promise<any>;
  salesPerformanceList(params: SalesTargetListParams): Promise<any>;
  getCashSettlementList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  updateCashsettlementStatus(id: string, input: UpdateCashsettlementtInput, userId: string): Promise<any>;
  listNewAddedWholeSalerRetailer(params: SalesTargetListParams): Promise<PaginationResult<any> | ErrorResponse>;

}

export interface SalesTargetDomainService {
  createSalesTarget(input: CreateSalesTargetInput, userId: string): Promise<any>;
  updateSalesTarget(id: string, input: UpdateSalesTargetInput, userId: string): Promise<any>;
  deleteSalesTarget(id: string, userId: string): Promise<any>;
  listSalesTargets(params: SalesTargetListParams): Promise<any>;
  listAchievedSalesTargets(params: SalesTargetListParams): Promise<any>;
  getSalesTargetById(id: string): Promise<any>;
  findSalesTargetExists(id: string): Promise<boolean | any>;
  salesPerformanceList(params: SalesTargetListParams): Promise<any>;
  getCashSettlementList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  updateCashsettlementStatus(id: string, input: UpdateCashsettlementtInput, userId: string): Promise<any>;
  listNewAddedWholeSalerRetailer(params: SalesTargetListParams): Promise<PaginationResult<any> | ErrorResponse>;

}
