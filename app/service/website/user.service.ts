import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";
import { MobileUserServiceDomain } from "../../../domain/website/user.domain";
import { CreateUserInput, LoginWebsiteInput } from "../../../api/Request/website.user";
import { CreateUserMobileApp } from "../../../api/Request/mobileAppUser";
export class UserService implements MobileUserServiceDomain {
  private adminRepository: MobileUserServiceDomain;

  constructor(adminRepository: MobileUserServiceDomain) {
    this.adminRepository = adminRepository;
  }
  async findUserByEmail(
    email: string
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    throw new Error("Method not implemented.");
  }
  async createUser(
    data: CreateUserInput
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.createUser(data);
    if (result.status === "error") return result;
    // result is ApiResponse<AdminUser>
    return result;
  }
  async getProfile(
    id: string
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.findUserByEmail(id);
    if (result.status === "error") return result;
    return result;
  }
    async loginUser(data: LoginWebsiteInput): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse> {
      // Delegate to repository loginAdmin
      return this.adminRepository.loginUser(data);
    }

  async updateUser(data: CreateUserMobileApp): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.updateUser(data);
  }
}

// Factory function for service
export function webSiteUserServiceFun(
  repo: MobileUserServiceDomain
): MobileUserServiceDomain {
  return new UserService(repo);
}
