import { StatusCodes } from "http-status-codes";
import { VendorDomainRepository, VendorDomainService, VendorListParams } from "../../../domain/admin/vendorDomain";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { Vendor, VendorDtls } from "../../../api/response/vendor.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { CreateVendorInput, UpdateVendorInput } from "../../../api/Request/vendor";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";

class VendorService implements VendorDomainService {
    private readonly vendorRepo: VendorDomainRepository;

    constructor(repo: VendorDomainRepository) {
        this.vendorRepo = repo;
    }
    async deleteVendor(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.vendorRepo.findVendorById(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            const vendorInProduct = await this.vendorRepo.findVenderInProduct(id)

            if (typeof vendorInProduct !== 'boolean' && 'status' in vendorInProduct && vendorInProduct.status === 'error') {
                return vendorInProduct as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Vendor not found',
                    StatusCodes.BAD_REQUEST,
                    'Error vendor not found'
                );
            }

            return await this.vendorRepo.deleteVendor(id, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error delete product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getVendorList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse> {
        try {
            return await this.vendorRepo.getVendorList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving vendor list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVendorById(id: string): Promise<ApiResponse<VendorDtls> | ErrorResponse> {
        // try {
        return await this.vendorRepo.findVendorById(id);
        // } catch (error: any) {
        //     return createErrorResponse(
        //         'Error retrieving vendor details',
        //         StatusCodes.INTERNAL_SERVER_ERROR,
        //         error.message
        //     );
        // }
    }

    async createVendor(vendorInput: CreateVendorInput, userId: string): Promise<ApiResponse<Vendor> | ErrorResponse> {
        try {
            // Check for existing vendor email
            const existingEmail = await this.vendorRepo.findVendorEmailExist(vendorInput?.phoneNumber.trim());

            // Handle potential error from repository
            if ('status' in existingEmail && existingEmail.status === 'error') {
                return existingEmail as ErrorResponse;
            }

            if ('count' in existingEmail && existingEmail.count > 0) {
                return createErrorResponse(
                    'Vendor email already exists',
                    StatusCodes.BAD_REQUEST,
                    'Error vendor email already exists'
                );
            }

            // Create the vendor
            return await this.vendorRepo.createVendor(vendorInput, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating vendor',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateVendor(vendorInput: UpdateVendorInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.vendorRepo.findVendorId(vendorInput.id);

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

            const existingEmail = await this.vendorRepo.findVendorEmailForUpdate(
                vendorInput?.phoneNumber.trim(),
                vendorInput.id
            );

            if ('status' in existingEmail && existingEmail.status === 'error') {
                return existingEmail as ErrorResponse;
            }

            const existing = existingEmail as { count: number; statusCode: number };

            if (existing.statusCode === StatusCodes.OK && existing.count > 0) {
                return createErrorResponse(
                    'Vendor email already exists',
                    StatusCodes.BAD_REQUEST,
                    'Error vendor email already exists'
                );
            }

            // Update the vendor
            return await this.vendorRepo.updateVendor(vendorInput, userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error updating vendor',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getVendoBasedProductsList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse> {
        // try {
        return await this.vendorRepo.getVendoBasedProductsList(params);
        // } catch (error: any) {
        //     return createErrorResponse(
        //         'Error retrieving vendor list',
        //         StatusCodes.INTERNAL_SERVER_ERROR,
        //         error.message
        //     );
        // }
    }
}

export function NewVendorService(repo: VendorDomainRepository): VendorDomainService {
    return new VendorService(repo);
}
