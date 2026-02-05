import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { BannerDomainRepository, BannerDomainService, BannerListParams } from "../../../domain/admin/bannerDomain";
import { CreateBannerInput, UpdateBannerInput } from "../../../api/Request/Banner";

class BannerService implements BannerDomainService {
    private readonly BannerRepo: BannerDomainRepository;

    constructor(repo: BannerDomainRepository) {
        this.BannerRepo = repo;
    }
    findBannerNameExist(name: string): Promise<{ count: number; statusCode: number; } | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    findBannerId(id: string): Promise<Boolean | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    findBannerNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number; } | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    findBannerInProduct(id: string): Promise<Boolean | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    async deleteBanner(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.BannerRepo.findBannerId(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Banner not found',
                    StatusCodes.BAD_REQUEST,
                    'Error Banner not found'
                );
            }

              const attriInProduct = await this.BannerRepo.findBannerInProduct(id)
            
            if (typeof attriInProduct !== 'boolean' && 'status' in attriInProduct && attriInProduct.status === 'error') {
                return attriInProduct as ErrorResponse;
            }

            return await this.BannerRepo.deleteBanner(id, userId);
        } catch (error:any) {
            return createErrorResponse(
                'Error delete Banner',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }        }

    async getBannerList(params: BannerListParams): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            return await this.BannerRepo.getBannerList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving Banner list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findBannerById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            return await this.BannerRepo.findBannerById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving Banner details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createBanner(BannerInput: CreateBannerInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
          

            // Create the Banner
            return await this.BannerRepo.createBanner(BannerInput,userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating Banner',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateBanner(BannerInput: UpdateBannerInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            // Update the Banner
            const response = await this.BannerRepo.updateBanner(BannerInput, userId);
            return response;
        } catch (error: any) {
            return createErrorResponse(
                'Error updating Banner',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function newBannerService(repo: BannerDomainRepository): BannerDomainService {
    return new BannerService(repo);
}
