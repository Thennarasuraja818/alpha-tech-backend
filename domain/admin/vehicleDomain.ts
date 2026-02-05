import { CreateVehicleInput, UpdateVehicleInput } from "../../api/Request/vehicle";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface VehicleListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    status?: 'active' | 'inactive' | 'expired';
}

export interface VehicleDomainRepository {
    findVehicleNumberExist(vehicleNumber: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createVehicle(vehicleInput: CreateVehicleInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    updateVehicle(vehicleInput: UpdateVehicleInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findVehicleId(id: string): Promise<boolean | ErrorResponse>;
    findVehicleNumberForUpdate(vehicleNumber: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findVehicleById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getVehicleList(params: VehicleListParams): Promise<PaginationResult<any> | ErrorResponse>;
    findVehicleInUsage(id: string): Promise<boolean | ErrorResponse>;
    deleteVehicle(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    toggleVehicleStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
}

export interface VehicleDomainService extends VehicleDomainRepository {}
