import { CreateKilometerInput, UpdateKilometerInput } from '../../api/Request/KilometerReq';
import { ApiResponse, ErrorResponse, SuccessMessage } from '../../api/response/commonResponse';
import { PaginationResult } from '../../api/response/paginationResponse';
import { CreateVehicleComplaintInput, UpdateDeiveryStatusInput, UpdateVehicleComplaintInput } from '../../api/Request/vehicleComplaint';
import { CreateDeliveryReqInput } from '../../api/Request/deliverymanreq';
import { CreateReturnPickedUpInput } from '../../api/Request/returnpickedup';
import { ReturnSettlementInput } from '../../api/Request/returnpickedupsettlement';


export interface DeliverymanDomainRepository {
    createKilometerHistory(input: CreateKilometerInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateKilometerHistory(input: UpdateKilometerInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    deliveryManOrderList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    createVehicleComplaint(input: CreateVehicleComplaintInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateVehicleComplaint(id: string, input: UpdateVehicleComplaintInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    deliveryComplaintList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    updateDeliveryStatus(id: string, input: UpdateDeiveryStatusInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    createRequest(input: CreateDeliveryReqInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    requestList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    createReturnPickedUp(input: CreateReturnPickedUpInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    returnPickedUpList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    returnPickedUpSettlement(input: ReturnSettlementInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    getKilometerDetails(input: any, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;

}