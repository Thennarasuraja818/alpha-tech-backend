import { CreateAdminInput, LoginAdminInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from "../../../api/Request/admin";
import { IAdminRepository, AdminServiceDomain } from "../../../domain/admin/adminDomain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";

export class AdminService implements AdminServiceDomain {
  private adminRepository: IAdminRepository;

  constructor(adminRepository: IAdminRepository) {
    this.adminRepository = adminRepository;
  }

  async createAdmin(data: CreateAdminInput): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.createAdmin(data);
    if (result.status === 'error') return result;
    // result is ApiResponse<AdminUser>
    return result;
  }

  async loginAdmin(data: LoginAdminInput): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse> {
    // Delegate to repository loginAdmin
    return this.adminRepository.loginAdmin(data);
  }

  async getProfile(id: string): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.findAdminById(id);
    if (result.status === 'error') return result;
    return result;
  }

  // Password management
  async forgotPassword(data: ForgotPasswordInput): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.forgotPassword(data);
  }
  async resetPassword(data: ResetPasswordInput): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.resetPassword(data);
  }
  async changePassword(id: string, data: ChangePasswordInput): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.changePassword(id, data);
  }
   async checkMobileNumber(phoneNumber: string): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.checkMobileNumber(phoneNumber);
  }
   async changePasswordByUserId(userId: string, newPassword: string): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.changePasswordByUserId(userId, newPassword);
  }
}

// Factory function for service
export function adminServiceFun(repo: IAdminRepository): AdminServiceDomain {
  return new AdminService(repo);
}
