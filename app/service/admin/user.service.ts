import { MobileLoginInput } from "../../../api/Request/mobileAppUser";
import { CreateUserInput, UserlistSchema, VerifyOtpInput, ChangePasswordAfterVerificationInput } from "../../../api/Request/user";
import { ApiResponse, ErrorResponse } from "../../../api/response/commonResponse";
import { IUserCreateRepository, UserServiceDomain } from "../../../domain/admin/userDomain";
import { ResetPasswordSchema, ChangePasswordInput } from "../../../api/Request/user";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { createErrorResponse } from "../../../utils/common/errors";

export class UserService implements UserServiceDomain {
  private userRepository: IUserCreateRepository;

  constructor(userRepository: IUserCreateRepository) {
    this.userRepository = userRepository;
  }

  // Business logic for creating a user
  async createUser(userData: CreateUserInput, profileImg?: any): Promise<any> {
    return this.userRepository.createUser(userData, profileImg);
  }

  async getAllUsers(opts: UserlistSchema): Promise<any> {
    return this.userRepository.getAllUsers(opts);
  }
  async getAllActiveUsers(opts: UserlistSchema): Promise<any> {
    return this.userRepository.getAllActiveUsers(opts);
  }
  async getUserSearch(opts: UserlistSchema): Promise<any> {
    return this.userRepository.getUserSearch(opts);
  }

  async getAllInactiveUsers(opts: UserlistSchema): Promise<any> {
    return this.userRepository.getAllInactiveUsers(opts);
  }

  async getUserById(id: string): Promise<any> {
    return this.userRepository.getUserById(id);

  }

  async updateUser(id: string, userData: Partial<CreateUserInput>, profileImg?: any): Promise<any> {
    try {
      return await this.userRepository.updateUser(id, userData, profileImg);
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Service error while updating user',
        statusCode: 500,
        error: error.message
      };
    }
  }

  async deleteUser(id: string): Promise<any> {
    try {
      const result = await this.userRepository.deleteUser(id);
      return result;
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Service error while deleting user',
        statusCode: 500,
        error: error.message
      };
    }
  }
  async loginUser(data: MobileLoginInput): Promise<ApiResponse<any> | ErrorResponse> {
    // Delegate to repository loginAdmin
    return this.userRepository.loginUser(data);
  }
  async resetPassword(id: string, data: ResetPasswordSchema): Promise<ApiResponse<any> | ErrorResponse> {
    // Delegate to repository loginAdmin
    return this.userRepository.resetPassword(id, data);
  }
  async changePassword(id: string, data: ChangePasswordInput): Promise<ApiResponse<any> | ErrorResponse> {
    // Delegate to repository loginAdmin
    return this.userRepository.changePassword(id, data);
  }
  async userLogList(params: any): Promise<PaginationResult<any> | ErrorResponse> {
    return await this.userRepository.userLogList(params);
  }
  async getAllCustomer(params: any): Promise<PaginationResult<any> | ErrorResponse> {
    return await this.userRepository.getAllCustomer(params);
  }
  // Add these methods to your UserService class
  // Add these methods to your UserService class
  async verifyOtp(data: VerifyOtpInput): Promise<ApiResponse<any> | ErrorResponse> {
    return this.userRepository.verifyOtp(data);
  }

  async changePasswordAfterVerification(data: ChangePasswordAfterVerificationInput): Promise<ApiResponse<any> | ErrorResponse> {
    return this.userRepository.changePasswordAfterVerification(data);
  }
  async getPincodes(data: string): Promise<ApiResponse<any> | ErrorResponse> {
    return this.userRepository.getPincodes(data);
  }
}
// Factory function for service
export function userServiceFun(userRepo: IUserCreateRepository): UserServiceDomain {
  return new UserService(userRepo);
}
