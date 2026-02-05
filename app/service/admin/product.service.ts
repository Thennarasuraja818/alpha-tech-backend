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

class ProductService implements ProductDomainService {
    private readonly productRepo: ProductDomainRepository;

    constructor(repo: ProductDomainRepository) {
        this.productRepo = repo;
    }
    async delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.productRepo.findIsProductExist(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Vendor not found',
                    StatusCodes.BAD_REQUEST,
                    'Error vendor not found'
                );
            }

            return await this.productRepo.delete(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error delete product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async create(product: ProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            // Check if product name exists
            const nameExists = await this.productRepo.findSlugExist(product.slug);

            if ('status' in nameExists && nameExists.status === 'error') {
                return nameExists as ErrorResponse;
            }

            // At this point, existingBrand must be the success response type
            const brandExists = nameExists as { count: number; statusCode: number };

            // Check if brand already exists
            if (brandExists.statusCode === StatusCodes.OK && brandExists.count > 0) {
                return createErrorResponse(
                    'Slug name already exists',
                    StatusCodes.CONFLICT
                );
            }

            const productDtls = await Uploads.processFiles(productImg, "product", 'img', '', '')
            const additionalImageDtls = await Uploads.processFiles(productAddtionalImg, "product", 'img', '', '')

            return await this.productRepo.create(product, userId, productDtls, additionalImageDtls);

        } catch (error: any) {
            return createErrorResponse(
                'Error creating product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async update(id: string, product: UpdateProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            const isExist = await this.productRepo.findIsProductExist(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Vendor not found',
                    StatusCodes.BAD_REQUEST,
                    'Error vendor not found'
                );
            }

            // If product name is updated, check if it exists
            const nameExists = await this.productRepo.findSlugExistForEdit(product.slug, id);


            if ('status' in nameExists && nameExists.status === 'error') {
                return nameExists as ErrorResponse;
            }

            const productDtls = await Uploads.processFiles(productImg, "product", 'img', '', '')
            const additionalImageDtls = await Uploads.processFiles(productAddtionalImg, "product", 'img', '', '')


            return await this.productRepo.update(id, product, userId, productDtls, additionalImageDtls);
        } catch (error: any) {
            return createErrorResponse(
                'Error updating product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getCurrentStock(): Promise<ApiResponse<ProductDocument[]> | ErrorResponse> {
        try {
            const result = await this.productRepo.getCurrentStock();
            if ('status' in result && result.status === 'error') {
                return result as ErrorResponse;
            }
            return {
                status: 'success',
                statusCode: StatusCodes.OK,
                message: 'Current stock retrieved successfully',
                data: result.data
            };
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving current stock',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getById(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse> {
        try {
            return await this.productRepo.getById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async list(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
        try {
            return await this.productRepo.list(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving products',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async activeList(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
        try {
            return await this.productRepo.activeList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving products',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewProductServiceRegister(repo: ProductDomainRepository): ProductDomainService {
    return new ProductService(repo);
}