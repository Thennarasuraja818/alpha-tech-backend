import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { VehicleDomainRepository, VehicleDomainService, VehicleListParams } from "../../../domain/admin/vehicleDomain";
import { CreateVehicleInput, UpdateVehicleInput } from "../../../api/Request/vehicle";

class VehicleService implements VehicleDomainService {
    private readonly vehicleRepo: VehicleDomainRepository;

    constructor(repo: VehicleDomainRepository) {
        this.vehicleRepo = repo;
    }

    async findVehicleNumberExist(vehicleNumber: string) {
        try {
            const result = await this.vehicleRepo.findVehicleNumberExist(vehicleNumber);
            if (result && 'status' in result) return result;
            return result || { count: 0, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse('Error checking vehicle number', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findVehicleId(id: string) {
        try {
            const result = await this.vehicleRepo.findVehicleId(id);
            if (result && typeof result === 'object' && 'status' in result) return result;
            return !!result;
        } catch (error: any) {
            return createErrorResponse('Error checking vehicle ID', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findVehicleNumberForUpdate(vehicleNumber: string, id: string) {
        try {
            const result = await this.vehicleRepo.findVehicleNumberForUpdate(vehicleNumber, id);
            if (result && 'status' in result) return result;
            return result || { count: 0, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse('Error checking vehicle number for update', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findVehicleInUsage(id: string) {
        try {
            const result = await this.vehicleRepo.findVehicleInUsage(id);
            if (result && typeof result === 'object' && 'status' in result) return result;
            return !!result;
        } catch (error: any) {
            return createErrorResponse('Error checking vehicle usage', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async deleteVehicle(id: string, userId: string) {
        try {
            const isExist = await this.findVehicleId(id);
            if (typeof isExist === 'object' && 'status' in isExist) return isExist;
            if (!isExist) return createErrorResponse('Vehicle not found', StatusCodes.BAD_REQUEST, 'Vehicle not found');

            const inUsage = await this.findVehicleInUsage(id);
            if (typeof inUsage === 'object' && 'status' in inUsage) return inUsage;
            if (inUsage) return createErrorResponse('Vehicle is in use and cannot be deleted', StatusCodes.BAD_REQUEST, 'Vehicle in use');

            return await this.vehicleRepo.deleteVehicle(id, userId);
        } catch (error: any) {
            return createErrorResponse('Error deleting vehicle', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async getVehicleList(params: VehicleListParams) {
        try {
            return await this.vehicleRepo.getVehicleList(params);
        } catch (error: any) {
            return createErrorResponse('Error retrieving vehicle list', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findVehicleById(id: string) {
        try {
            return await this.vehicleRepo.findVehicleById(id);
        } catch (error: any) {
            return createErrorResponse('Error retrieving vehicle details', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async createVehicle(vehicleInput: CreateVehicleInput, userId: string) {
        try {
            const exists = await this.findVehicleNumberExist(vehicleInput.vehicleNumber);
            if (exists && 'status' in exists) return exists;
            if ((exists as { count: number }).count > 0) {
                return createErrorResponse('Vehicle number already exists', StatusCodes.BAD_REQUEST, 'Duplicate vehicle number');
            }

            return await this.vehicleRepo.createVehicle(vehicleInput, userId);
        } catch (error: any) {
            return createErrorResponse('Error creating vehicle', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async updateVehicle(vehicleInput: UpdateVehicleInput, userId: string) {
        try {
            if (!vehicleInput.id) {
                return createErrorResponse('Vehicle ID is required', StatusCodes.BAD_REQUEST, 'Missing vehicle ID');
            }

            const exists = await this.findVehicleNumberForUpdate(vehicleInput.vehicleNumber, vehicleInput.id);
            if (exists && 'status' in exists) return exists;
            if ((exists as { count: number }).count > 0) {
                return createErrorResponse('Vehicle number already exists', StatusCodes.BAD_REQUEST, 'Duplicate vehicle number');
            }

            return await this.vehicleRepo.updateVehicle(vehicleInput, userId);
        } catch (error: any) {
            return createErrorResponse('Error updating vehicle', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async toggleVehicleStatus(id: string, userId: string) {
        try {
            const isExist = await this.findVehicleId(id);
            if (typeof isExist === 'object' && 'status' in isExist) return isExist;
            if (!isExist) return createErrorResponse('Vehicle not found', StatusCodes.BAD_REQUEST, 'Vehicle not found');

            return await this.vehicleRepo.toggleVehicleStatus(id, userId);
        } catch (error: any) {
            return createErrorResponse('Error toggling vehicle status', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

export function newVehicleService(repo: VehicleDomainRepository): VehicleDomainService {
    return new VehicleService(repo);
}
