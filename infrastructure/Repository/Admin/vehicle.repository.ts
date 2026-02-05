import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { VehicleListParams, CreateVehicleInput, UpdateVehicleInput } from "../../../api/Request/vehicle";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { VehicleDomainRepository } from "../../../domain/admin/vehicleDomain";
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { VehicleModel } from "../../../app/model/vehicle";
import { OrderModel } from "../../../app/model/order";

class VehicleRepository implements VehicleDomainRepository {
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }

    async findVehicleNumberExist(vehicleNumber: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await VehicleModel.countDocuments({
                vehicleNumber,
                isActive: true,
                isDelete: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking vehicle number',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVehicleNumberForUpdate(vehicleNumber: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await VehicleModel.countDocuments({
                vehicleNumber,
                _id: { $ne: new Types.ObjectId(id) },
                isActive: true,
                isDelete: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking vehicle number',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async findVehicleInUsage(id: string): Promise<boolean | ErrorResponse> {
        try {
            const count = await OrderModel.countDocuments({
                vehicleId: new Types.ObjectId(id),
                isDelete: false
            });

            return count > 0;
        } catch (error: any) {
            return createErrorResponse(
                'Error checking vehicle usage',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async deleteVehicle(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const deletedVehicle = await VehicleModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), isDelete: false },
                {
                    $set: {
                        isDelete: true,
                        modifiedBy: new Types.ObjectId(userId),
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            if (!deletedVehicle) {
                return createErrorResponse(
                    'Vehicle not found',
                    StatusCodes.NOT_FOUND,
                    'Vehicle with given ID not found'
                );
            }

            return successResponse("Vehicle deleted successfully", StatusCodes.OK, {
                message: 'Vehicle deleted successfully'
            });
        } catch (error: any) {
            return createErrorResponse(
                'Error deleting vehicle',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getVehicleList(params: VehicleListParams): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, sort, status } = params;
            const matchStage: any = { isDelete: false };

            if (search) {
                matchStage.vehicleNumber = { $regex: search, $options: "i" };
            }

            if (typeof status === "boolean") {
                matchStage.isActive = status;
            }

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $facet: {
                        data: [
                            { $sort: { createdAt: sort === "asc" ? 1 : -1 } },
                            { $skip: page * limit },
                            { $limit: limit }
                        ],
                        totalCount: [{ $count: "count" }]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totalCount: { $arrayElemAt: ["$totalCount.count", 0] }
                    }
                }
            ];

            const result = await VehicleModel.aggregate(pipeline);

            const vehicles = result[0]?.data || [];
            const totalCount = result[0]?.totalCount || 0;
            return Pagination(totalCount, vehicles, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                "Error retrieving vehicle list",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }


    async findVehicleById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const vehicle = await VehicleModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });

            if (!vehicle) {
                return createErrorResponse(
                    'Vehicle not found',
                    StatusCodes.NOT_FOUND,
                    'Vehicle with given ID not found'
                );
            }

            return successResponse(
                'Vehicle details retrieved successfully',
                StatusCodes.OK,
                vehicle
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving vehicle details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findVehicleId(id: string): Promise<boolean | ErrorResponse> {
        try {
            const vehicle = await VehicleModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            });
            return !!vehicle;
        } catch (error: any) {
            return createErrorResponse(
                'Error finding vehicle',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createVehicle(vehicleInput: CreateVehicleInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const vehicle = new VehicleModel({
                vehicleNumber: vehicleInput.vehicleNumber,
                fcDate: vehicleInput.fcDate,
                insuranceDate: vehicleInput.insuranceDate,
                taxDate: vehicleInput.taxDate,
                permitDate: vehicleInput.permitDate,
                advertiseDate: vehicleInput.advertiseDate,
                pollutionDate: vehicleInput.pollutionDate,
                status: vehicleInput.status,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId)
            });

            const result = await vehicle.save();
            return successResponse(
                "Vehicle created successfully",
                StatusCodes.CREATED,
                result
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error creating vehicle',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateVehicle(vehicleInput: UpdateVehicleInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const existingVehicle = await VehicleModel.findOne({ _id: vehicleInput.id });

            if (!existingVehicle) {
                return createErrorResponse(
                    'Vehicle not found',
                    StatusCodes.NOT_FOUND,
                    'Vehicle not found'
                );
            }

            const updateData = {
                vehicleNumber: vehicleInput.vehicleNumber ?? existingVehicle.vehicleNumber,
                fcDate: vehicleInput.fcDate ?? existingVehicle.fcDate,
                insuranceDate: vehicleInput.insuranceDate ?? existingVehicle.insuranceDate,
                taxDate: vehicleInput.taxDate ?? existingVehicle.taxDate,
                permitDate: vehicleInput.permitDate ?? existingVehicle.permitDate,
                advertiseDate: vehicleInput.advertiseDate ?? existingVehicle.advertiseDate,
                pollutionDate: vehicleInput.pollutionDate ?? existingVehicle.pollutionDate,
                status: vehicleInput.status ?? existingVehicle.status,
                modifiedBy: new Types.ObjectId(userId),
                updatedAt: new Date()
            };

            const result = await VehicleModel.findByIdAndUpdate(
                { _id: vehicleInput.id },
                updateData,
                { new: true }
            );

            if (!result) {
                return createErrorResponse(
                    'Error updating vehicle',
                    StatusCodes.BAD_REQUEST,
                    'Unable to update vehicle'
                );
            }

            return successResponse(
                "Vehicle updated successfully",
                StatusCodes.OK,
                result
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error updating vehicle',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async toggleVehicleStatus(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const vehicle = await VehicleModel.findOne({ _id: id });

            if (!vehicle) {
                return createErrorResponse(
                    'Vehicle not found',
                    StatusCodes.NOT_FOUND,
                    'Vehicle not found or already deleted'
                );
            }

            const newStatus = !vehicle.isActive;
            const updateTime = new Date();

            const updatedVehicle = await VehicleModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        isActive: newStatus,
                        modifiedBy: userId,
                        updatedAt: updateTime
                    }
                },
                { new: true }
            );

            if (!updatedVehicle) {
                return createErrorResponse(
                    'Failed to update vehicle status',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Update operation failed'
                );
            }

            return successResponse(
                "Vehicle status updated successfully",
                StatusCodes.OK,
                {
                    message: 'Vehicle status updated',
                    isActive: newStatus,
                    vehicleId: updatedVehicle._id,
                    updatedAt: updateTime
                }
            );
        } catch (error: any) {
            return createErrorResponse(
                'Error toggling vehicle status',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewVehicleRepository(db: any): VehicleDomainRepository {
    return new VehicleRepository(db);
}
