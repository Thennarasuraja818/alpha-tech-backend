import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CreateWholesaler, OtpVerification, AddPin, MobileLoginInput, StatusUpdate, CreditUpdate } from "../../api/Request/wholesalerRequest";
import { ChangePasswordInput } from "../../api/Request/user";

export interface IWholesalerRepository {
    // Password management
    findUserByEmail(
        email: string
    ): Promise<ApiResponse<any> | ErrorResponse>;
    createUser(
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse>;
    otpVerification(
        data: OtpVerification
    ): Promise<ApiResponse<any> | ErrorResponse>;
    // addPin(
    //     data: AddPin
    // ): Promise<ApiResponse<any> | ErrorResponse>;
    loginUser(
        data: MobileLoginInput
    ): Promise<ApiResponse<any> | ErrorResponse>;
    updateUser(
        id: string, data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse>;
    getAll(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        userId?: '';
        order?: 'asc' | 'desc';
        type?: ''
    }): Promise<ApiResponse<any> | ErrorResponse>;
    updateStatus(
        data: StatusUpdate
    ): Promise<ApiResponse<any> | ErrorResponse>;
    sendOtp(phone: string): Promise<ApiResponse<any> | ErrorResponse>;
    changePassword(id: string,
        data: ChangePasswordInput
    ): Promise<ApiResponse<any> | ErrorResponse>;
    updateCreditForWholeSalerRetailer(input: CreditUpdate, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>
}

export interface WholesalerServiceDomain {
    findUserByEmail(
        email: string
    ): Promise<ApiResponse<any> | ErrorResponse>;
    createUser(
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse>;
    otpVerification(
        data: OtpVerification
    ): Promise<ApiResponse<any> | ErrorResponse>;
    loginUser(
        data: MobileLoginInput
    ): Promise<ApiResponse<any> | ErrorResponse>;
    updateUser(
        id: string, data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse>;
    getAll(options: {
        limit?: number;
        page?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        userId?: string;
        type?: string
    }): Promise<ApiResponse<any> | ErrorResponse>;
    updateStatus(
        data: StatusUpdate
    ): Promise<ApiResponse<any> | ErrorResponse>;
    sendOtp(phone: string): Promise<ApiResponse<any> | ErrorResponse>;
    changePassword(id: string,
        data: ChangePasswordInput
    ): Promise<ApiResponse<any> | ErrorResponse>;
    updateCreditForWholeSalerRetailer(input: CreditUpdate, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>
}
