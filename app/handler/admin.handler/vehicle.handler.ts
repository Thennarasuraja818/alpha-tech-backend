import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { VehicleListQuerySchema, VehicleSchema } from "../../../api/Request/vehicle";
import { VehicleDomainService } from "../../../domain/admin/vehicleDomain";

export class VehicleHandler {
    private vehicleService: VehicleDomainService;

    constructor(vehicleService: VehicleDomainService) {
        this.vehicleService = vehicleService;
    }

    createVehicle = async (req: Request, res: Response): Promise<any> => {
        try {
            const payload = req.body;
            const validation = VehicleSchema.safeParse(payload);

            if (!validation.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid vehicle data',
                    'VALIDATION_ERROR',
                    validation.error.errors
                );
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }

            const response = await this.vehicleService.createVehicle(validation.data, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    updateVehicle = async (req: Request, res: Response): Promise<any> => {
        try {
            const id = req.params?.id;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Vehicle ID is required', 'INVALID_PARAMS');
            }

            const payload = { ...req.body, id };
            const validation = VehicleSchema.safeParse(payload);

            if (!validation.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid vehicle data',
                    'VALIDATION_ERROR',
                    validation.error.errors
                );
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'User not authenticated', 'UNAUTHORIZED');
            }

            const response = await this.vehicleService.updateVehicle(validation.data, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    getVehicleDetails = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Vehicle ID is required', 'INVALID_PARAMS');
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Vehicle ID format', 'INVALID_PARAMS');
            }

            const response = await this.vehicleService.findVehicleById(id);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    getVehicleList = async (req: Request, res: Response): Promise<any> => {
        try {
            const queryResult = VehicleListQuerySchema.safeParse(req.query);
            if (!queryResult.success) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid query parameters',
                    'INVALID_QUERY_PARAMS',
                    queryResult.error.errors
                );
            }

            const { page, limit, search, sort, status } = queryResult.data;

            const response = await this.vehicleService.getVehicleList({
                page,
                limit,
                search,
                sort,
                status
            });

            return sendPaginationResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    deleteVehicle = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Vehicle ID is required', 'INVALID_PARAMS');
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Vehicle ID format', 'INVALID_PARAMS');
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'User not authenticated', 'UNAUTHORIZED');
            }

            const response = await this.vehicleService.deleteVehicle(id, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }

    toggleVehicleStatus = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            if (!id) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Vehicle ID is required', 'INVALID_PARAMS');
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Vehicle ID format', 'INVALID_PARAMS');
            }

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(res, StatusCodes.UNAUTHORIZED, 'User not authenticated', 'UNAUTHORIZED');
            }

            const response = await this.vehicleService.toggleVehicleStatus(id, userId);
            return sendResponse(res, response);

        } catch (error: any) {
            return sendErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message, 'INTERNAL_SERVER_ERROR');
        }
    }
}

export function VehicleHandlerFun(service: VehicleDomainService): VehicleHandler {
    return new VehicleHandler(service);
}
