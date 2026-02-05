import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";
import { CreateWholesaler, OtpVerification, AddPin, MobileLoginInput, StatusUpdate, CreditUpdate, ChangePasswordAfterVerificationInput } from "../../../api/Request/wholesalerRequest";
import { ChangePasswordInput } from "../../../api/Request/user";
import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import { WholesalerServiceDomain } from "../../../domain/admin/wholsalerDomain";

export class WholesalerService implements WholesalerServiceDomain {
    private wholesalerRepository: WholesalerServiceDomain;

    constructor(wholesalerRepository: WholesalerServiceDomain) {
        this.wholesalerRepository = wholesalerRepository;
    }
    async updateCreditForWholeSalerRetailer(input: CreditUpdate, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            return await this.wholesalerRepository.updateCreditForWholeSalerRetailer(input, userId)

        } catch (error: any) {
            return createErrorResponse(
                'Error update route',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async findUserByEmail(
        email: string
    ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    async createUser(
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.createUser(data);
        if (result.status === "error") return result;
        // result is ApiResponse<AdminUser>
        return result;
    }

    async otpVerification(
        data: OtpVerification
    ): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.otpVerification(data);
        if (result.status === "error") return result;
        return result;
    }


    async loginUser(
        data: MobileLoginInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.loginUser(data);
        if (result.status === "error") return result;
        return result;
    }
    async updateUser(id: string,
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.updateUser(id, data);
        if (result.status === "error") return result;
        // result is ApiResponse<AdminUser>
        return result;
    }
    async getAll(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        type?: '';
        from?: ''
    }): Promise<ApiResponse<any> | ErrorResponse> {
        return this.wholesalerRepository.getAll(options);
    }
    async getAllWithInactive(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        type?: '';
        from?: ''
    }): Promise<ApiResponse<any> | ErrorResponse> {
        return this.wholesalerRepository.getAllWithInactive(options);
    }
    async getAllApproved(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        type?: '';
        from?: ''
    }): Promise<ApiResponse<any> | ErrorResponse> {
        return this.wholesalerRepository.getAllApproved(options);
    }
    async updateStatus(
        data: StatusUpdate
    ): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.updateStatus(data);
        if (result.status === "error") return result;
        return result;
    }
    async sendOtp(
        phone: string
    ): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.sendOtp(phone);
        if (result.status === "error") return result;
        return result;
    }
    async changePassword(id: string, data: ChangePasswordInput): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.wholesalerRepository.changePassword(id, data);
        if (result.status === "error") return result;
        // result is ApiResponse<AdminUser>
        return result;
    }
    async changePasswordAfterVerification(data: ChangePasswordAfterVerificationInput): Promise<ApiResponse<any> | ErrorResponse> {
        return this.wholesalerRepository.changePasswordAfterVerification(data);
    }
}

// Factory function for service
export function wholesalerServiceFun(
    repo: WholesalerServiceDomain
): WholesalerServiceDomain {
    return new WholesalerService(repo);
}
