import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { AddPin, CreateUserMobileApp, MobileLoginInput, OtpVerification } from "../../api/Request/mobileAppUser";
import { ChangePasswordInput } from "../../api/Request/user";

export interface IMobileUserRepository {
  // Password management
  createUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse>;
  findUserByEmail(
    email: string
  ): Promise<ApiResponse<any> | ErrorResponse>;
  otpVerification(
    data: OtpVerification
  ): Promise<ApiResponse<any> | ErrorResponse>;
  addPin(
    data: AddPin
  ): Promise<ApiResponse<any> | ErrorResponse>;
  loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  changePassword(id: string,
    data: ChangePasswordInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  updateUser(id: string,
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse>;
   userData(id:string): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface MobileUserServiceDomain {
  findUserByEmail(
    email: string
  ): Promise<ApiResponse<any> | ErrorResponse>;

  createUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse>;
  otpVerification(
    data: OtpVerification
  ): Promise<ApiResponse<any> | ErrorResponse>;
  addPin(
    data: AddPin
  ): Promise<ApiResponse<any> | ErrorResponse>;
  loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  changePassword(id: string,
    data: ChangePasswordInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  updateUser(id: string,
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse>;
  userData(id: string): Promise<ApiResponse<any> | ErrorResponse>;
}
