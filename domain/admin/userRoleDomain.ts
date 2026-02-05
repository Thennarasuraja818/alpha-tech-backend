import { CreateUserRoleInput } from "../../api/Request/userRole";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";
import { UserRoles } from "../../api/response/userRole.response";

export interface IUserRoleCreateRepository {
    createUserRole(data: CreateUserRoleInput): Promise<ApiResponse<UserRoles> | ErrorResponse>;
    getAllUserRole(params: { page: number; limit: number; search?: string }): Promise<PaginationResult<UserRoles[]> | ErrorResponse>;
    getUserRoleById(id: string): Promise<ApiResponse<UserRoles> | ErrorResponse>;
    updateUserRole(id: string, data: Partial<CreateUserRoleInput>): Promise<ApiResponse<UserRoles> | ErrorResponse>;
    deleteUserRole(id: string): Promise<ApiResponse<any> | ErrorResponse>;
  }


export interface UserRoleServiceDomain{
    createUserRole(data: CreateUserRoleInput): Promise<ApiResponse<UserRoles> | ErrorResponse>;
    getAllUserRole(params: { page: number; limit: number; search?: string }): Promise<PaginationResult<UserRoles[]> | ErrorResponse>;
    getUserRoleById(id: string): Promise<ApiResponse<UserRoles> | ErrorResponse>;
    updateUserRole(id: string, data: Partial<CreateUserRoleInput>): Promise<ApiResponse<UserRoles> | ErrorResponse>;
    deleteUserRole(id: string): Promise<ApiResponse<any> | ErrorResponse>;

}