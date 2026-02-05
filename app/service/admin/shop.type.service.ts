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
import { ShopTypeDomainRepository, ShopTypeDomainService } from "../../../domain/admin/shop.typeDomain";
import { CreateShopTypeInput, UpdateShopTypeInput } from "../../../api/Request/shop.type";

class ShopTypeServices implements ShopTypeDomainService {
    private readonly rootRepo: ShopTypeDomainRepository;

    constructor(repo: ShopTypeDomainRepository) {
        this.rootRepo = repo;
    }
    async createShopeType(input: CreateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.rootRepo.createShopeType(input, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating shop type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async updateShoptype(input: UpdateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.rootRepo.updateShoptype(input, userId);

        } catch (error: any) {
            return createErrorResponse(
                'Error update shop type',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getShoptypeById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {

            return await this.rootRepo.getShoptypeById(id);

        } catch (error: any) {
            return createErrorResponse(
                'Error finding route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getShopTypeList(params: RootListParams): Promise<PaginationResult<any[]> | ErrorResponse> {
        try {
            return await this.rootRepo.getShopTypeList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error finding route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async deleteShopType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            return await this.rootRepo.deleteShopType(id, userId);

        } catch (error: any) {
            return createErrorResponse(
                'Error delete route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewShopTypeServiceRegister(repo: ShopTypeDomainRepository): ShopTypeDomainService {
    return new ShopTypeServices(repo);
}