import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { TaxDomainRepository, TaxDomainService, TaxListParams } from "../../../domain/admin/taxDomain";
import { CreateTaxInput, UpdateTaxInput } from "../../../api/Request/tax";

class TaxService implements TaxDomainService {
    private readonly taxRepo: TaxDomainRepository;

    constructor(repo: TaxDomainRepository) {
        this.taxRepo = repo;
    }

    async findTaxNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const result = await this.taxRepo.findTaxNameExist(name);
            if (result && 'status' in result) {
                return result;
            }
            return result || { count: 0, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax name',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxId(id: string): Promise<boolean | ErrorResponse> {
        try {
            const result = await this.taxRepo.findTaxId(id);
            if (result && typeof result === 'object' && 'status' in result) {
                return result;
            }
            return !!result;
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax ID',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const result = await this.taxRepo.findTaxNameForUpdate(name, id);
            if (result && 'status' in result) {
                return result;
            }
            return result || { count: 0, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax name for update',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxInUsage(id: string): Promise<boolean | ErrorResponse> {
        try {
            const result = await this.taxRepo.findTaxInUsage(id);
            if (result && typeof result === 'object' && 'status' in result) {
                return result;
            }
            return !!result;
        } catch (error: any) {
            return createErrorResponse(
                'Error checking tax usage',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteTax(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.findTaxId(id);
            if (typeof isExist === 'object' && 'status' in isExist) {
                return isExist;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Tax not found',
                    StatusCodes.BAD_REQUEST,
                    'Tax not found'
                );
            }

            const taxInUsage = await this.findTaxInUsage(id);
            if (typeof taxInUsage === 'object' && 'status' in taxInUsage) {
                return taxInUsage;
            }

            if (taxInUsage) {
                return createErrorResponse(
                    'Tax is in use and cannot be deleted',
                    StatusCodes.BAD_REQUEST,
                    'Tax in use'
                );
            }

            return await this.taxRepo.deleteTax(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error deleting tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getTaxList(params: TaxListParams): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            return await this.taxRepo.getTaxList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving tax list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findTaxById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            return await this.taxRepo.findTaxById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving tax details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createTax(taxInput: CreateTaxInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const nameExists = await this.findTaxNameExist(taxInput.taxName);
            if (nameExists && 'status' in nameExists) {
                return nameExists;
            }

            if ((nameExists as { count: number }).count > 0) {
                return createErrorResponse(
                    'Tax name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Duplicate tax name'
                );
            }

            return await this.taxRepo.createTax(taxInput, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateTax(taxInput: UpdateTaxInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            if (!taxInput.id) {
                return createErrorResponse(
                    'Tax ID is required',
                    StatusCodes.BAD_REQUEST,
                    'Missing tax ID'
                );
            }

            const nameExists = await this.findTaxNameForUpdate(taxInput.taxName, taxInput.id);
            if (nameExists && 'status' in nameExists) {
                return nameExists;
            }

            if ((nameExists as { count: number }).count > 0) {
                return createErrorResponse(
                    'Tax name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Duplicate tax name'
                );
            }

            return await this.taxRepo.updateTax(taxInput, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error updating tax',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async toggleTaxStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.findTaxId(id);
            if (typeof isExist === 'object' && 'status' in isExist) {
                return isExist;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Tax not found',
                    StatusCodes.BAD_REQUEST,
                    'Tax not found'
                );
            }

            return await this.taxRepo.toggleTaxStatus(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error toggling tax status',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function newTaxService(repo: TaxDomainRepository): TaxDomainService {
    return new TaxService(repo);
}