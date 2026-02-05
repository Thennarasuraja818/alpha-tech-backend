import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { AdminUser } from "../../api/response/admin.response";
import { CreateUserMobileApp, MobileLoginInput } from "../../api/Request/mobileAppUser";
export interface IWebsiteUserRepository {
  // Password management
  createUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  findUserByEmail(
    email: string
  ): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse>;
  updateUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface MobileUserServiceDomain {
  findUserByEmail(
    email: string
  ): Promise<ApiResponse<AdminUser> | ErrorResponse>;

  createUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse>;
  updateUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse>;
}
