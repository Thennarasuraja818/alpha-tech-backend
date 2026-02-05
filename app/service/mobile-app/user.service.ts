import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";
import { MobileUserServiceDomain } from "../../../domain/mobile-app/user.domain";
import { AddPin, CreateUserMobileApp, MobileLoginInput, OtpVerification } from "../../../api/Request/mobileAppUser";
import { ChangePasswordInput } from "../../../api/Request/user";
export class UserService implements MobileUserServiceDomain {
  private adminRepository: MobileUserServiceDomain;

  constructor(adminRepository: MobileUserServiceDomain) {
    this.adminRepository = adminRepository;
  }
  async changePassword(id: string, data: ChangePasswordInput): Promise<ApiResponse<any> | ErrorResponse> {
    const result = await this.adminRepository.changePassword(id, data);
    if (result.status === "error") return result;
    // result is ApiResponse<AdminUser>
    return result;
  }
  async findUserByEmail(
    email: string
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    throw new Error("Method not implemented.");
  }
  async createUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.createUser(data);
    if (result.status === "error") return result;
    // result is ApiResponse<AdminUser>
    return result;
  }
  async otpVerification(
    data: OtpVerification
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.otpVerification(data);
    if (result.status === "error") return result;
    // result is ApiResponse<AdminUser>
    return result;
  }
  async addPin(
    data: AddPin
  ): Promise<ApiResponse<any> | ErrorResponse> {
    const result = await this.adminRepository.addPin(data);
    if (result.status === "error") return result;
    // result is ApiResponse<AdminUser>
    return result;
  }
  async loginUser(data: MobileLoginInput): Promise<ApiResponse<any> | ErrorResponse> {
    // Delegate to repository loginAdmin
    return this.adminRepository.loginUser(data);
  }
  async updateUser(id: string,
    data: CreateUserMobileApp
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.updateUser(id, data);
    if (result.status === "error") return result;
    return result;
  }
    async userData(id: string,
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.userData(id);
    if (result.status === "error") return result;
    return result;
  }
}

// Factory function for service
export function mobileUserServiceFun(
  repo: MobileUserServiceDomain
): MobileUserServiceDomain {
  return new UserService(repo);
}
