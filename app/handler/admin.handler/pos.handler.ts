import { StatusCodes } from "http-status-codes";
import { CreateCustomerInput, createCustomerSchema } from "../../../api/Request/customer";
import { PosServiceDomain } from "../../../domain/admin/posDomain";
import { PosService } from "../../service/admin/pos.service";
import { Request, Response } from "express";
import { sendErrorResponse, sendResponse } from "../../../utils/common/commonResponse";
import { CreateOrderInput, createOrderSchema } from "../../../api/Request/order";
import { calculateDeliveryCharge } from "../../../utils/common/generateSlug";

export class PosHandler {
    private userService: PosServiceDomain;

    constructor(userService: PosServiceDomain) {
        this.userService = userService;
    }
    createCustomer = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = createCustomerSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
            }
            const userId = req.user?.id;

            const userData: CreateCustomerInput = result.data as CreateCustomerInput;
            userData.createdBy = userId
            userData.modifiedBy = userId

            const user = await this.userService.createCustomer(userData);

            res.status(StatusCodes.OK).json(user);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    getAllCustomers = async (req: Request, res: Response): Promise<any> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const offset = parseInt(req.query.offset as string) || 0;
            const search = (req.query.search as string) || undefined;
            const sortBy = (req.query.sortBy as string) || 'createdAt';
            const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';

            const users = await this.userService.getAllCustomers({ limit, offset, search, sortBy, order });
            res.status(StatusCodes.OK).json(users);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    getCustomerById = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            const user = await this.userService.getCustomerById(id);
            ;
            if (!user) {
                return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
            }

            res.status(StatusCodes.OK).json(user);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    getDeliveryCharge = async (req: Request, res: Response): Promise<any> => {
        try {
            const { variants, shippingWeight, quantity } = req.body;

            if (!variants || !Array.isArray(variants)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: false,
                    message: 'variants must be an array'
                });
            }

            if (!shippingWeight) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: false,
                    message: 'shippingWeight is required'
                });
            }

            const deliveryCharge = calculateDeliveryCharge(
                variants,
                shippingWeight,
                quantity ?? 1
            );

            return res.status(StatusCodes.OK).json({
                status: true,
                deliveryCharge
            });
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: false,
                error: err.message
            });
        }
    };

    updateUser = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            const result = createCustomerSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
            }

            const userId = req.user?.id;
            const userData = {
                ...result.data,
                modifiedBy: userId
            };

            const response = await this.userService.updateCustomer(id, userData);
            res.status(response.statusCode as number).json(response);
        } catch (err: any) {

            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    deleteUser = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;
            const userId = req.user?.id;
            const response = await this.userService.deleteCustomer(id, userId);
            res.status(response.statusCode as number).json(response);
        } catch (err: any) {

            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    createOrder = async (req: Request, res: Response): Promise<any> => {
        try {

            const userId = req.user?.id;
            if (!userId) {
                return sendErrorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    'User not authenticated',
                    'UNAUTHORIZED'
                );
            }
            const parsed = createOrderSchema.safeParse(req.body);

            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }
            const data: CreateOrderInput = parsed.data;
            // data.placedBy = userId;
            const result = await this.userService.createOrder(data, req.user!.id);
            sendResponse(res, result);
        } catch (err: any) {
            sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR',
                err.message
            );
        }
    };
}
export function newPosHandlerRegister(
    service: PosServiceDomain
): PosHandler {
    return new PosHandler(service);
}