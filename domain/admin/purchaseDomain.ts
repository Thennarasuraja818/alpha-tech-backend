import { CreatePurchaseInput, UpdatePurchaseInput } from "../../api/Request/purchase";
import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { PaginationResult } from "../../api/response/paginationResponse";
import Vendorpurchase from "../../app/model/vendor.purchase";
import { VendorListParams, VendorPayments } from "../../api/Request/vendor";
import { VendorDtls } from "../../api/response/vendor.response";
export interface IVendorpurchaseRepository {
    createVendorpurchase(data: CreatePurchaseInput): Promise<ApiResponse<any> | ErrorResponse>;
    getVendorpurchaseById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getAllVendorpurchases(options: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        order?: "asc" | "desc";
    }): Promise<PaginationResult<any> | ErrorResponse>;
    updateVendorpurchase(id: string, data: UpdatePurchaseInput): Promise<ApiResponse<any> | ErrorResponse>;
    deleteVendorpurchase(id: string, userId: string): Promise<ApiResponse<null> | ErrorResponse>;
    getVendorPaymentList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;
    updatePayment(id: string, data: VendorPayments): Promise<ApiResponse<any> | ErrorResponse>;
    getVendorPaymentDues(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;

}

export interface VendorpurchaseServiceDomain {
    createVendorpurchase(data: CreatePurchaseInput): Promise<ApiResponse<any> | ErrorResponse>;
    getVendorpurchaseById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getAllVendorpurchases(options: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        order?: "asc" | "desc";
    }): Promise<PaginationResult<any> | ErrorResponse>;
    updateVendorpurchase(id: string, data: UpdatePurchaseInput): Promise<ApiResponse<any> | ErrorResponse>;
    deleteVendorpurchase(id: string, userId: string): Promise<ApiResponse<null> | ErrorResponse>;
    getVendorPaymentList(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;
    updatePayment(id: string, data: VendorPayments): Promise<ApiResponse<any> | ErrorResponse>;
    getVendorPaymentDues(params: VendorListParams): Promise<PaginationResult<VendorDtls> | ErrorResponse>;
}