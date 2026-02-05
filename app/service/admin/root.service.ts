import { StatusCodes } from "http-status-codes";
import { CreateBrandInput, UpdateBrandInput } from "../../../api/Request/brand";
import { Brand, BrandDtls } from "../../../api/response/brand.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { BrandDomainRepository, BrandDomainService, BrandListParams } from "../../../domain/admin/brandDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { Uploads } from "../../../utils/uploads/image.upload";
import { ProductDomainRepository, ProductDomainService, ProductListParams } from "../../../domain/admin/productDomain";
import { ProductInput, UpdateProductInput } from "../../../api/Request/product";
import { ProductDocument } from "../../../api/response/product.response";
import { RootDomainRepository, RootDomainService, RootListParams } from "../../../domain/admin/root.Domain";
import { CreateRootInput, UpdateRootInput } from "../../../api/Request/root";
import { RootDocumentResponse } from "../../../api/response/root.response";
import { CreateCustomerVariant, UpdateCustomerVariantRetailer } from "../../../api/Request/customer.variant";

class RootServices implements RootDomainService {
    private readonly rootRepo: RootDomainRepository;

    constructor(repo: RootDomainRepository) {
        this.rootRepo = repo;
    }
    async createRoute(input: CreateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.rootRepo.createRoute(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async updateRoue(input: UpdateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.rootRepo.findRootIsExist(input.id)

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Error. Route not found',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Route is not found'
                );
            }

            return await this.rootRepo.updateRoue(input, userId);

        } catch (error: any) {
            return createErrorResponse(
                'Error update route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getRouteById(id: string): Promise<ApiResponse<RootDocumentResponse> | ErrorResponse> {
        try {
            const isExist = await this.rootRepo.findRootIsExist(id)

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Error. route not found',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Route is not found'
                );
            }

            return await this.rootRepo.getRouteById(id);

        } catch (error: any) {
            return createErrorResponse(
                'Error finding route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse> {
        try {
            return await this.rootRepo.getRouteList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error finding route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteRoot(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.rootRepo.findRootIsExist(id)

            if (!isExist && typeof isExist !== 'object') {
                return createErrorResponse(
                    'Error. Route not found',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Route is not found'
                );
            }

            if (typeof isExist === 'object' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            return await this.rootRepo.deleteRoot(id, userId);

        } catch (error: any) {
            return createErrorResponse(
                'Error delete route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async createCustomerVariant(input: CreateCustomerVariant, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.rootRepo.createCustomerVariant(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async customerVariantList(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.rootRepo.customerVariantList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async updateCustomerVariantForCustomer(input: UpdateCustomerVariantRetailer, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.rootRepo.updateCustomerVariantForCustomer(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewRootServiceRegister(repo: RootDomainRepository): RootDomainService {
    return new RootServices(repo);
}