import { Types } from 'mongoose';
import { SalesTargetDomainRepository, SalesTargetDomainService, SalesTargetListParams } from '../../../domain/admin/salesAndTargetsDomain';
import { CreateSalesTargetInput, UpdateCashsettlementtInput, UpdateSalesTargetInput } from '../../../api/Request/salesAndTargets';
import { PaginationResult } from '../../../api/response/paginationResponse';
import { ErrorResponse } from '../../../api/response/cmmonerror';

export class SalesTargetService implements SalesTargetDomainService {
    private readonly salesTargetRepo: SalesTargetDomainRepository;

    constructor(repo: SalesTargetDomainRepository) {
        this.salesTargetRepo = repo;
    }

    findSalesTargetExists(id: string): Promise<boolean | any> {
        throw new Error('Method not implemented.');
    }

    async createSalesTarget(input: CreateSalesTargetInput, userId: string): Promise<any> {
        try {
            const processedInput = {
                ...input,
                salemanId: new Types.ObjectId(input.salemanId)
            };
            return await this.salesTargetRepo.createSalesTarget(processedInput, userId);
        } catch (error: any) {
            throw new Error(`Failed to create sales target: ${error.message}`);
        }
    }

    async updateSalesTarget(id: string, input: UpdateSalesTargetInput, userId: string): Promise<any> {
        try {
            const exists = await this.salesTargetRepo.findSalesTargetExists(id);
            if (!exists) {
                throw new Error('Sales target not found');
            }

            // Convert string IDs to ObjectId if needed
            const processedInput = input.salemanId
                ? { ...input, salemanId: new Types.ObjectId(input.salemanId) }
                : input;

            return await this.salesTargetRepo.updateSalesTarget(id, processedInput, userId);
        } catch (error: any) {
            throw new Error(`Failed to update sales target: ${error.message}`);
        }
    }

    async deleteSalesTarget(id: string, userId: string): Promise<any> {
        try {
            const exists = await this.salesTargetRepo.findSalesTargetExists(id);
            if (!exists) {
                throw new Error('Sales target not found');
            }
            return await this.salesTargetRepo.deleteSalesTarget(id, userId);
        } catch (error: any) {
            throw new Error(`Failed to delete sales target: ${error.message}`);
        }
    }

    async getSalesTargetById(id: string): Promise<any> {
        try {
            const result = await this.salesTargetRepo.getSalesTargetById(id);
            if (!result) {
                throw new Error('Sales target not found');
            }
            return result;
        } catch (error: any) {
            throw new Error(`Failed to get sales target: ${error.message}`);
        }
    }

    async listSalesTargets(params: SalesTargetListParams): Promise<any> {
        try {
            // Convert salemanId to ObjectId if provided
            const processedParams = params.salemanId
                ? { ...params, salemanId: new Types.ObjectId(params.salemanId) }
                : params;

            return await this.salesTargetRepo.listSalesTargets(processedParams);
        } catch (error: any) {
            throw new Error(`Failed to list sales targets: ${error.message}`);
        }
    }
    async salesPerformanceList(params: SalesTargetListParams): Promise<any> {
        try {
            // Convert salemanId to ObjectId if provided
            const processedParams = params.salemanId
                ? { ...params, salemanId: new Types.ObjectId(params.salemanId) }
                : params;

            return await this.salesTargetRepo.salesPerformanceList(processedParams);
        } catch (error: any) {
            throw new Error(`Failed to list sales targets: ${error.message}`);
        }
    }
    async getCashSettlementList(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        const result = await this.salesTargetRepo.getCashSettlementList(params);
        if (result.status === "error") return result;
        return result;
    }
    async updateCashsettlementStatus(id: string, input: UpdateCashsettlementtInput, userId: string): Promise<any> {
        try {
            return await this.salesTargetRepo.updateCashsettlementStatus(id, input, userId);
        } catch (error: any) {
            throw new Error(`Failed to update sales target: ${error.message}`);
        }
    }
    async listAchievedSalesTargets(params: SalesTargetListParams): Promise<any> {
        try {
            return await this.salesTargetRepo.listAchievedSalesTargets(params);
        } catch (error: any) {
            throw new Error(`Failed to list sales targets: ${error.message}`);
        }
    }
    async listNewAddedWholeSalerRetailer(params: SalesTargetListParams): Promise<any> {
        try {
            return await this.salesTargetRepo.listNewAddedWholeSalerRetailer(params);
        } catch (error: any) {
            throw new Error(`Failed to list sales targets: ${error.message}`);
        }
    }
}
