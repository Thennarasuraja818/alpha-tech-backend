import { StatusCodes } from "http-status-codes";
import { CreateVariantInput, UpdateVariantInput, VariantListParams } from "../../../api/Request/variant";
import { Variant, VariantDtls } from "../../../api/response/variant.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { VariantDomainRepository, VariantDomainService } from "../../../domain/admin/variantDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";

class VariantService implements VariantDomainService {
    private readonly variantRepo: VariantDomainRepository;

    constructor(repo: VariantDomainRepository) {
        this.variantRepo = repo;
    }

    async deleteVariant(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.variantRepo.findVariantId(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Variant not found',
                    StatusCodes.BAD_REQUEST,
                    'Error Variant not found'
                );
            }

            return await this.variantRepo.deleteVariant(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error delete Variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getVariantList(params: VariantListParams): Promise<PaginationResult<VariantDtls> | ErrorResponse> {
        try {
            return await this.variantRepo.getVariantList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving variant list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVariantById(id: string): Promise<ApiResponse<VariantDtls> | ErrorResponse> {
        try {
            return await this.variantRepo.findVariantById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving variant details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createVariant(variantInput: CreateVariantInput, userId: string): Promise<ApiResponse<Variant> | ErrorResponse> {
        try {
            // Check for existing variant name
            const existingName = await this.variantRepo.findVariantNameExist(variantInput.name.trim());

            if ('count' in existingName && existingName.count > 0) {
                return createErrorResponse(
                    'Variant name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Error variant name already exists'
                );
            }

            // Create the variant
            return await this.variantRepo.createVariant({
                name: variantInput.name.trim()
            }, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateVariant(variantInput: UpdateVariantInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.variantRepo.findVariantId(variantInput.id);

            if (isExist === false) {
                return createErrorResponse(
                    'Variant not found',
                    StatusCodes.BAD_REQUEST,
                    'Error variant not found'
                );
            }

            if (typeof isExist != 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            const existingName = await this.variantRepo.findVariantNameForUpdate(
                variantInput.name.trim(),
                variantInput.id
            );

            if ('status' in existingName && existingName.status === 'error') {
                return existingName as ErrorResponse;
            }

            const existing = existingName as { count: number; statusCode: number };

            if (existing.statusCode === StatusCodes.OK && existing.count > 0) {
                return createErrorResponse(
                    'Variant name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Error variant name already exists'
                );
            }

            // Update the variant
            const response = await this.variantRepo.updateVariant(variantInput, userId);
            return response;
        } catch (error: any) {
            return createErrorResponse(
                'Error updating variant',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewVariantService(repo: VariantDomainRepository): VariantDomainService {
    return new VariantService(repo);
}
