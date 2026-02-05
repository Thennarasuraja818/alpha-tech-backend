import { CreateVendorInput, UpdateVendorInput } from "../../api/Request/vendor";
import { Vendor, VendorDtls } from "../../api/response/vendor.response";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { OrderDocument } from "../../app/model/order";

export interface VendorListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    type: string;
    vendorId: string | ""
}

export interface UserOrderDomainRepository {
       list(params: { page: number; limit: number, type: string, userId: string, orderStatus: string }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
   
}

export interface UserOrderDomainService {
       list(params: { page: number; limit: number, type: string, userId: string, orderStatus: string }): Promise<PaginationResult<OrderDocument> | ErrorResponse>;
   
}
