import { StatusCodes } from "http-status-codes";

import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { ProductDomainRepository, ProductDomainService, ProductListParams } from "../../../domain/mobile-app/productDomain";
import { ProductInput, UpdateProductInput } from "../../../api/Request/product";
import { ProductDocument } from "../../../api/response/product.response";

class ProductService implements ProductDomainService {
    private readonly productRepo: ProductDomainRepository;

    constructor(repo: ProductDomainRepository) {
        this.productRepo = repo;
    }
    async findTopRatedProduct(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
        try {
            return await this.productRepo.findTopRatedProduct(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving products',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async create(product: ProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
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
                    'Brand name already exists',
                    StatusCodes.CONFLICT
                );
            }

            return await this.productRepo.create(product, userId);

        } catch (error: any) {
            return createErrorResponse(
                'Error creating product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async update(id: string, product: UpdateProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            // If product name is updated, check if it exists

            const nameExists = await this.productRepo.findSlugExistForEdit(product.slug, id);


            if ('status' in nameExists && nameExists.status === 'error') {
                return nameExists as ErrorResponse;
            }

            // At this point, existingBrand must be the success response type
            const brandExists = nameExists as { count: number; statusCode: number };

            // Check if brand already exists
            if (brandExists.statusCode === StatusCodes.OK && brandExists.count > 0) {
                return createErrorResponse(
                    'Brand name already exists',
                    StatusCodes.CONFLICT
                );
            }



            return await this.productRepo.update(id, product, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error updating product',
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
    async getProductByCategoryId(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse> {
        try {
            return await this.productRepo.getProductByCategoryId(id);
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
}

export function NewProductServiceRegister(repo: ProductDomainRepository): ProductDomainService {
    return new ProductService(repo);
}