import { MobileLoginInput } from "../../api/Request/mobileAppUser";
import { CreateUserInput, ResetPasswordSchema, UserlistSchema, ChangePasswordInput, VerifyOtpInput, ChangePasswordAfterVerificationInput } from "../../api/Request/user";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { User } from "../../api/response/user.response";

export interface IUserCreateRepository {
  createUser(userData: CreateUserInput, profileImg?: any): Promise<ApiResponse<User> | ErrorResponse>;
  updateUser(
    id: string,
    userData: Partial<CreateUserInput>,
    profileImg?: any
  ): Promise<ApiResponse<User> | ErrorResponse>;
  findUserByEmail(email: string): Promise<ApiResponse<User> | ErrorResponse>;
  // getAllUsers(): Promise<ApiResponse<User[]> | ErrorResponse>;
  getAllUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
  getUserSearch(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;

  getAllActiveUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
  getAllInactiveUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
  getUserById(id: string): Promise<ApiResponse<User> | ErrorResponse>;
  // updateUser(
  //   id: string,
  //   userData: Partial<CreateUserInput>
  // ): Promise<ApiResponse<User> | ErrorResponse>;

  deleteUser(id: string): Promise<ApiResponse<any> | ErrorResponse>;
  loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  resetPassword(
    id: string,
    data: ResetPasswordSchema,
  ): Promise<ApiResponse<any> | ErrorResponse>;
  changePassword(
    id: string,
    data: ChangePasswordInput,
  ): Promise<ApiResponse<any> | ErrorResponse>;
  userLogList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  getAllCustomer(params: any): Promise<PaginationResult<any> | ErrorResponse>;

  verifyOtp(
    data: VerifyOtpInput
  ): Promise<ApiResponse<any> | ErrorResponse>;

  changePasswordAfterVerification(
    data: ChangePasswordAfterVerificationInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  getPincodes(userId: string): Promise<ApiResponse<any> | ErrorResponse>;
}

export interface UserServiceDomain {
  createUser(userData: CreateUserInput, profileImg?: any): Promise<ApiResponse<User> | ErrorResponse>;
  updateUser(
    id: string,
    userData: Partial<CreateUserInput>,
    profileImg?: any
  ): Promise<ApiResponse<User> | ErrorResponse>;
   getAllUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
  getAllActiveUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
  getUserSearch(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;

  getAllInactiveUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
  getUserById(id: string): Promise<ApiResponse<User> | ErrorResponse>;
  // updateUser(
  //   id: string,
  //   userData: Partial<CreateUserInput>
  // ): Promise<ApiResponse<User> | ErrorResponse>;

  deleteUser(id: string): Promise<ApiResponse<any> | ErrorResponse>;
  loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  resetPassword(
    id: string,
    data: ResetPasswordSchema,
  ): Promise<ApiResponse<any> | ErrorResponse>;
  changePassword(
    id: string,
    data: ChangePasswordInput,
  ): Promise<ApiResponse<any> | ErrorResponse>;
  userLogList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  getAllCustomer(params: any): Promise<PaginationResult<any> | ErrorResponse>;
  verifyOtp(
    data: VerifyOtpInput
  ): Promise<ApiResponse<any> | ErrorResponse>;

  changePasswordAfterVerification(
    data: ChangePasswordAfterVerificationInput
  ): Promise<ApiResponse<any> | ErrorResponse>;
  getPincodes(userId: string): Promise<ApiResponse<any> | ErrorResponse>;


}