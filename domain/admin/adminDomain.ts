import { CreateAdminInput, LoginAdminInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from "../../api/Request/admin";
import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { AdminUser } from "../../api/response/admin.response";

export interface IAdminRepository {
  createAdmin(data: CreateAdminInput): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  findAdminByEmail(email: string): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  findAdminById(id: string): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  loginAdmin(data: LoginAdminInput): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse>;
  // Password management
  forgotPassword(data: ForgotPasswordInput): Promise<ApiResponse<any> | ErrorResponse>;
  resetPassword(data: ResetPasswordInput): Promise<ApiResponse<any> | ErrorResponse>;
  changePassword(id: string, data: ChangePasswordInput): Promise<ApiResponse<any> | ErrorResponse>;
  checkMobileNumber(phoneNumber: string): Promise<ApiResponse<any> | ErrorResponse>;
  changePasswordByUserId(userId: string, newPassword: string): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface AdminServiceDomain {
  createAdmin(data: CreateAdminInput): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  loginAdmin(data: LoginAdminInput): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse>;
  getProfile(id: string): Promise<ApiResponse<AdminUser> | ErrorResponse>;
  // Password management
  forgotPassword(data: ForgotPasswordInput): Promise<ApiResponse<any> | ErrorResponse>;
  resetPassword(data: ResetPasswordInput): Promise<ApiResponse<any> | ErrorResponse>;
  changePassword(id: string, data: ChangePasswordInput): Promise<ApiResponse<any> | ErrorResponse>;
  checkMobileNumber(phoneNumber: string): Promise<ApiResponse<any> | ErrorResponse>;
  changePasswordByUserId(userId: string, newPassword: string): Promise<ApiResponse<any> | ErrorResponse>;
}
