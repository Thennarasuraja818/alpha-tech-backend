import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { LineManServiceDomain } from "../../../domain/mobile-app/line-manDomain";
import { Types } from "mongoose";
import { logAdminUserActivity } from "../../../utils/utilsFunctions/admin.users.activity";
import { ReceivePaymentInput, receivePaymentSchema } from "../../../api/Request/receivePayment";
import { RazorpayServiceDomain } from "../../../domain/mobile-app/razorpayDomain";
import { CreateRazorpayInput, createRazorpaySchema } from "../../../api/Request/razorpayInput";

export class RazorpayHandler {
    private userService: RazorpayServiceDomain;

    constructor(userService: RazorpayServiceDomain) {
        this.userService = userService;
    }
    handleJuspayResponse = async (req: Request, res: Response<any>): Promise<any> => {
        try {
            const body = req.body;
            const result = await this.userService.handleJuspayResponse(req, res);

            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    status: "error",
                    message: err.message
                });
        }
    };

    getWalletHistory = async (req: Request, res: Response): Promise<any> => {
        try {

            const userId = req.params.id;
            // data.createdBy = userId;
            const result = await this.userService.getWalletHistory({ userId });
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            // Insert User Activity
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };
    generateQRforPayment = async (req: Request, res: Response): Promise<any> => {
        try {
            const parsed = createRazorpaySchema.safeParse(req.body);
            if (!parsed.success) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ errors: parsed.error.errors });
            }

            // const userId = req.user.id;
            // if (!userId || !ObjectId.isValid(userId)) {
            //     return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User Id required' });
            // }
            const data: CreateRazorpayInput = parsed.data;
            // data.createdBy = userId;
            const result = await this.userService.generateQRforPayment(data);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            // Insert User Activity
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };
    getUserWallet = async (req: Request, res: Response): Promise<any> => {
        try {

            const userId = req.params.id as string ?? undefined;
            const result = await this.userService.getUserWallet(userId);
            if (result.status === "error") {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }

            // Insert User Activity
            return res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: err.message });
        }
    };

}

export function RazorpayHandlerFun(service: RazorpayServiceDomain): RazorpayHandler {
    return new RazorpayHandler(service);
}
