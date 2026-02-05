import { StatusCodes } from "http-status-codes";
import { CreateBrandInput, UpdateBrandInput } from "../../../api/Request/brand";
import { Brand, BrandDtls } from "../../../api/response/brand.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { BrandDomainRepository, BrandDomainService, BrandListParams } from "../../../domain/admin/brandDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { Uploads } from "../../../utils/uploads/image.upload";

class BrandService implements BrandDomainService {
    private readonly brandRepo: BrandDomainRepository;

    constructor(repo: BrandDomainRepository) {
        this.brandRepo = repo;
    }
    async deleteBrand(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.brandRepo.findBrandId(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'brand not found',
                    StatusCodes.BAD_REQUEST,
                    'Error brand not found'
                );
            }

            const brandInProduct = await this.brandRepo.findBrandInProduct(id)

            if (typeof brandInProduct !== 'boolean' && 'status' in brandInProduct && brandInProduct.status === 'error') {
                return brandInProduct as ErrorResponse;
            }

            return await this.brandRepo.deleteBrand(id, userId);
        } catch (error:any) {
            return createErrorResponse(
                'Error delete brand',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }    }
    async getBrandList(params: BrandListParams): Promise<PaginationResult<BrandDtls> | ErrorResponse> {
        try {
            return await this.brandRepo.getBrandList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving brand list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
   async findBrandById(id: string): Promise<ApiResponse<BrandDtls> | ErrorResponse> {
       try {
        const isExist = await this.brandRepo.findBrandId(id)

        if (typeof isExist !== 'boolean' &&'status' in isExist && isExist.status === 'error') {
         return isExist as ErrorResponse;
        }

         if(!isExist){
             return createErrorResponse(
                 'Brand not found.',
                 StatusCodes.CONFLICT
             );
         }

         return await this.brandRepo.findBrandById(id)
         
       } catch (error:any) {
        return createErrorResponse(
            'Error creating brand',
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
        );
       }
    }
    async updateBrand(brandInput: UpdateBrandInput, logo: any, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            
           const isExist = await this.brandRepo.findBrandId(brandInput.id)

           if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
            return isExist as ErrorResponse;
           }

           if(!isExist){
            return createErrorResponse(
                'Brand not found.',
                StatusCodes.CONFLICT
            );
           }
            // Check for existing brand name
            const existingBrand = await this.brandRepo.findBrandNameForUpdate(brandInput.name, brandInput.id);

            // Handle potential error from repository
            if ('status' in existingBrand && existingBrand.status === 'error') {
                return existingBrand as ErrorResponse;
            }

            // At this point, existingBrand must be the success response type
            const brandExists = existingBrand as { count: number; statusCode: number };
            
            // Check if brand already exists
            if (brandExists.statusCode === StatusCodes.OK && brandExists.count > 0) {
                return createErrorResponse(
                    'Brand name already exists',
                    StatusCodes.CONFLICT
                );
            }

            // Create the brand
            return await this.brandRepo.updateBrand(brandInput, logo, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating brand',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    /**
     * Create a new brand after validating input and checking for duplicates
     * @param brandInput - The brand data to create
     * @returns ApiResponse containing the created brand, or error response
     */
    async createBrand(brandInput: CreateBrandInput, logo: any, userId: string): Promise<ApiResponse<Brand> | ErrorResponse> {
        try {
            
            // Check for existing brand name
            const existingBrand = await this.brandRepo.findBrandNameExist(brandInput.name);

            // Handle potential error from repository
            if ('status' in existingBrand && existingBrand.status === 'error') {
                return existingBrand as ErrorResponse;
            }

            // At this point, existingBrand must be the success response type
            const brandExists = existingBrand as { count: number; statusCode: number };
            
            // Check if brand already exists
            if (brandExists.statusCode === StatusCodes.OK && brandExists.count > 0) {
                return createErrorResponse(
                    'Brand name already exists',
                    StatusCodes.CONFLICT
                );
            }
            
          const logoDtls = await Uploads.processFiles(logo,brandInput.name.trim(),'img','','')
          
            // Create the brand
            return await this.brandRepo.createBrand({name: brandInput.name.trim()},logoDtls, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating brand',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewBrandServiceRegister(brandRepo: BrandDomainRepository): BrandDomainService {
    return new BrandService(brandRepo)
}