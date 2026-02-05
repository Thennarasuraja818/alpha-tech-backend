import { CreateUserRoleInput } from "../../../api/Request/userRole";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { UserRoles } from "../../../api/response/userRole.response";
import { IUserRoleCreateRepository, UserRoleServiceDomain } from "../../../domain/admin/userRoleDomain";

export class UserRoleService implements UserRoleServiceDomain {

    private userRoleRepository: IUserRoleCreateRepository;

    constructor(userRoleRepository: IUserRoleCreateRepository) {
        this.userRoleRepository = userRoleRepository;
    }



    // Business logic for creating a user
    async createUserRole(userData: CreateUserRoleInput): Promise<any> {

        return this.userRoleRepository.createUserRole(userData);

    }

async getAllUserRole(params: { page: number; limit: number; search?: string }): Promise<any> {
    return this.userRoleRepository.getAllUserRole(params);
}



    async getUserRoleById(id: string): Promise<any> {
        return this.userRoleRepository.getUserRoleById(id);

    }
    async updateUserRole(id: string, userData: Partial<CreateUserRoleInput>): Promise<any> {
        try {
            return await this.userRoleRepository.updateUserRole(id, userData);
        } catch (error: any) {
            return {
                status: 'error',
                message: 'Service error while updating user',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async deleteUserRole(id: string): Promise<any>  {
        try {
            const result= await this.userRoleRepository.deleteUserRole(id);
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


}
// Factory function for service
export function UserRoleServiceFun(userRoleRepo: IUserRoleCreateRepository): UserRoleServiceDomain {
    return new UserRoleService(userRoleRepo);
}
