import { CreateVendorInput, UpdateVendorInput } from "../../api/Request/vendor";
import { Vendor, VendorDtls } from "../../api/response/vendor.response";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface VendorListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    type: string;
    vendorId: string | "",
    format?:string
}

export interface VendorDomainRepository {
    findVendorEmailExist(email: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createVendor(vendorInput: CreateVendorInput, userId: string): Promise<ApiResponse<Vendor> | ErrorResponse>;
    updateVendor(vendorInput: UpdateVendorInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findVendorId(id: string): Promise<Boolean | ErrorResponse>;
    findVendorEmailForUpdate(email: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findVendorById(id: string): Promise<ApiResponse<VendorDtls> | ErrorResponse>;
    getVendorList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;
    findVenderInProduct(id: string): Promise<Boolean | ErrorResponse>;
    deleteVendor(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getVendoBasedProductsList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;

}

export interface VendorDomainService {
    createVendor(vendorInput: CreateVendorInput, userId: string): Promise<ApiResponse<Vendor> | ErrorResponse>;
    updateVendor(vendorInput: UpdateVendorInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findVendorById(id: string): Promise<ApiResponse<VendorDtls> | ErrorResponse>;
    getVendorList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;
    deleteVendor(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getVendoBasedProductsList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;

}
