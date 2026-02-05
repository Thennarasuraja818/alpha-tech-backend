import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CreateRazorpayInput } from "../../api/Request/razorpayInput";
import { PaginationResult } from "../../api/response/paginationResponse";
import { Request, Response } from "express";

export interface IRazorpayRepository {
    getUserWallet(userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    handleJuspayResponse(req: Request, res: Response<any>): Promise<any>;
    // handleJuspayWebhook(req: Request, res: Response<any>): Promise<any>;
    getWalletHistory(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    generateQRforPayment(data: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse>;
    getPaymentDetails(input: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface RazorpayServiceDomain {
    getWalletHistory(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    generateQRforPayment(data: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse>;
    getUserWallet(userId: string): Promise<ApiResponse<any> | ErrorResponse>;
    handleJuspayResponse(req: Request, res: Response<any>): Promise<any>;
    // handleJuspayWebhook(req: Request, res: Response<any>): Promise<any>;
    getPaymentDetails(input: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse>;
}