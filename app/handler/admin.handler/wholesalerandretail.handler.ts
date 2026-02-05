import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
    CreateWholesaler,
    createWholesalerSchema,
    otpVerificationSchema,
    addPinSchema,
    mobileLoginSchema,
    updateStatusSchema,
    StatusUpdate,
    creditUpdate,
} from "../../../api/Request/wholesalerRequest";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import WholesalerRetailsers from "../../model/Wholesaler";
import { Types } from 'mongoose';
import { ChangePasswordInput, changePasswordSchema, changePasswordAfterVerificationSchema } from "../../../api/Request/user";
import { WholesalerServiceDomain } from "../../../domain/admin/wholsalerDomain";

export class WholsalerHandler {
    private userService: WholesalerServiceDomain;
    wholesalerService: any;

    constructor(userService: WholesalerServiceDomain) {
        this.userService = userService;
    }

    createUser = async (req: Request, res: Response): Promise<any> => {
        try {
            // Parse the JSON strings for address and location
            const parseNestedFields = (body: any) => {
                const parsed = { ...body };

                if (typeof body.address === 'string') {
                    try {
                        parsed.address = JSON.parse(body.address);
                    } catch (e) {
                        console.error('Error parsing address JSON:', e);
                        parsed.address = {};
                    }
                }

                if (typeof body.location === 'string') {
                    try {
                        parsed.location = JSON.parse(body.location);
                    } catch (e) {
                        console.error('Error parsing location JSON:', e);
                        parsed.location = {};
                    }
                }

                return parsed;
            };

            const parsedBody = parseNestedFields(req.body);
            console.log(parsedBody, "Parsed body");

            const parsed = createWholesalerSchema.safeParse(parsedBody);
            console.log(parsed, "Validation result");
            // const parsed = createWholesalerSchema.safeParse(req.body);
            // console.log(parsed, "ppppppppp");

            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }
            console.log(req?.user?.id, 'req?.user?.id')
            if (!req?.user?.id) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: 'User Id is required' });
            }

            const files = (req.files as any)?.shopImage;
            console.log(files, "files");

            const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
            console.log(images, "imagesssssssss");
            const payload = { ...parsedBody, shopImage: images };
            console.log(payload, "pppppppalaaaaa");
            const data: CreateWholesaler = payload;
            data.createdBy = req?.user?.id;
            data.modifiedBy = req?.user?.id;
            console.log(data, "dataaaaaaa");
            console
            if (!data.customerType) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: "Customer type is required" });
            }
            const user = await WholesalerRetailsers.find({ customerType: data.customerType, isActive: 1, isDelete: 0 }).sort({ Id: -1 });
            console.log(user.length, 'length')
            if (data.customerType == 'Wholesaler') {
                data.Id = `WS${String((user.length ?? 0) + 1).padStart(3, '0')}`
            } else {
                data.Id = `RE${String((user.length ?? 0) + 1).padStart(3, '0')}`
            }

            const result = await this.userService.createUser(data);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };

    // OTP verification handler
    otpVerification = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = otpVerificationSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
            }
            const data = parsed.data;
            const result = await this.userService.otpVerification(data);
            if (result.status === "error") return res.status(StatusCodes.BAD_REQUEST).json(result);
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    // Login handler
    loginUser = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = mobileLoginSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
            }
            const data = parsed.data;
            const result = await this.userService.loginUser(data);
            if (result.status === "error") return res.status(StatusCodes.UNAUTHORIZED).json(result);
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    updateUser = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.params as any;

        const parseNestedFields = (body: any) => {
            const parsed = { ...body };

            if (typeof body.address === 'string') {
                try {
                    parsed.address = JSON.parse(body.address);
                } catch (e) {
                    console.error('Error parsing address JSON:', e);
                    parsed.address = {};
                }
            }

            if (typeof body.location === 'string') {
                try {
                    parsed.location = JSON.parse(body.location);
                } catch (e) {
                    console.error('Error parsing location JSON:', e);
                    parsed.location = {};
                }
            }

            return parsed;
        };

        const parsedBody = parseNestedFields(req.body);
        const parsed = createWholesalerSchema.safeParse(parsedBody);

        if (!parsed.success) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
        }
        const files = (req.files as any)?.shopImage;
        console.log(files, "files");

        const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
        console.log(images, "imagesssssssss");
        const payload = { ...parsedBody, shopImage: images };
        console.log(payload, "pppppppalaaaaa");
        const data: CreateWholesaler = payload;
        const result = await this.userService.updateUser(id, data);
        if (result.status === "error") {
            const code =
                result.statusCode === StatusCodes.NOT_FOUND
                    ? StatusCodes.NOT_FOUND
                    : StatusCodes.BAD_REQUEST;
            return res.status(code).json(result);
        }
        res.status(StatusCodes.OK).json(result);
    };
    getAll = async (req: Request, res: Response): Promise<any> => {

        const userId = (req.user?.id as string) || '';

        if (!userId || !Types.ObjectId.isValid(userId)) {
            return sendErrorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                'User Id required',
                'User Id required'
            );
        }
        // parse pagination and filter params
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || undefined;
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const type = (req.query.type as string) || '';
        const from = (req.query.from as string) || 'mobile-app';
        const result: any = await this.userService.getAll({ limit, page, search, sortBy, order, userId, type, from });
        if (result.status === "error") {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
        }
        return sendPaginationResponse(res, result);
    };

    getAllWithInactive = async (req: Request, res: Response): Promise<any> => {

        const userId = (req.user?.id as string) || '';

        if (!userId || !Types.ObjectId.isValid(userId)) {
            return sendErrorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                'User Id required',
                'User Id required'
            );
        }
        // parse pagination and filter params
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || undefined;
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const type = (req.query.type as string) || '';
        const from = (req.query.from as string) || 'mobile-app';
        const result: any = await this.userService.getAllWithInactive({ limit, page, search, sortBy, order, userId, type, from });
        if (result.status === "error") {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
        }
        return sendPaginationResponse(res, result);
    };
    getAllApproved = async (req: Request, res: Response): Promise<any> => {

        const userId = (req.user?.id as string) || '';

        if (!userId || !Types.ObjectId.isValid(userId)) {
            return sendErrorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                'User Id required',
                'User Id required'
            );
        }
        // parse pagination and filter params
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || undefined;
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const type = (req.query.type as string) || '';
        const from = (req.query.from as string) || 'mobile-app';
        const result: any = await this.userService.getAllApproved({ limit, page, search, sortBy, order, userId, type, from });
        if (result.status === "error") {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
        }
        return sendPaginationResponse(res, result);
    };
    updateStatus = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = updateStatusSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
            }
            const data: StatusUpdate = parsed.data;
            const result = await this.userService.updateStatus(data);
            if (result.status === "error") return res.status(StatusCodes.BAD_REQUEST).json(result);
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    sendOtp = async (req: Request, res: Response): Promise<any> => {
        try {
            const phone = req.body.phone;
            if (!phone) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "Phone number is required",
                });
            }
            const result = await this.userService.sendOtp(phone);
            if (result.status === "error") return res.status(StatusCodes.BAD_REQUEST).json(result);
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };
    changePassword = async (req: Request & { user: any }, res: Response): Promise<any> => {
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
        }
        const userId = parsed?.data?.userId as string ?? '';
        if (!userId) {
            res.status(StatusCodes.BAD_REQUEST).json({
                status: "error",
                message: "UserId is required",
            });
        }
        const result = await this.userService.changePassword(userId, parsed.data as ChangePasswordInput);
        return res.status(result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK).json(result);
    };

    updateCredit = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = creditUpdate.safeParse(req.body);
            if (!result.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
            }

            const userId = req.user?.id;
            const input = {
                ...result.data,
            };

            const response = await this.userService.updateCreditForWholeSalerRetailer(input, userId);
            return sendResponse(res, response);
        } catch (err: any) {
            return sendErrorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Internal server error',
                'INTERNAL_SERVER_ERROR'
            );
        }
    }
    changePasswordAfterVerification = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = changePasswordAfterVerificationSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
            }

            const result = await this.userService.changePasswordAfterVerification(parsed.data);
            return res.status(result.statusCode as number).json(result);
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

}

export function WholesalerHandlerFun(service: WholesalerServiceDomain): WholsalerHandler {
    return new WholsalerHandler(service);
}
