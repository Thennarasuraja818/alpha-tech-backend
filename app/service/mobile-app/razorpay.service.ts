import { Request, Response } from "express";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { RazorpayServiceDomain } from "../../../domain/mobile-app/razorpayDomain";
import { CreateRazorpayInput } from "../../../api/Request/razorpayInput";
import { PaginationResult } from "../../../api/response/paginationResponse";

export class RazorpayService implements RazorpayServiceDomain {
    constructor(private adminRepository: RazorpayServiceDomain) {}

    async generateQRforPayment(data: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.generateQRforPayment(data);
        if (result.status === "error") return result;
        return result;
    }

    async getUserWallet(userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.getUserWallet(userId);
        if (result.status === "error") return result;
        return result;
    }

    async getWalletHistory(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        const result = await this.adminRepository.getWalletHistory(params);
        if (result.status === "error") return result;
        return result;
    }

    async handleJuspayResponse(req: Request, res: Response<any>): Promise<any> {
        const result = await this.adminRepository.handleJuspayResponse(req, res);
        if (result.status === "error") return result;
        return result;
    }

    async getPaymentDetails(input: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.getPaymentDetails(input);
        if (result.status === "error") return result;
        return result;
    }
}

export function mobileUserServiceFun(repo: RazorpayServiceDomain): RazorpayServiceDomain {
    return new RazorpayService(repo);
}