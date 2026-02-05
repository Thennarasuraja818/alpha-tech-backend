import { ApiResponse, ErrorResponse, SuccessMessage } from '../../api/response/commonResponse';
import { PaginationResult } from '../../api/response/paginationResponse';
import { UpdateComplaintStatus, UpdateRequestStatus } from '../../api/Request/vehicleComplaint';

export interface DeliverymanDomainRepository {
    deliveryManOrderList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    deliveryComplaintList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    requestList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    updateComplaintStatus(id: string, input: UpdateComplaintStatus, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    updateRequestStatus(id: string, input: UpdateRequestStatus, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;

}