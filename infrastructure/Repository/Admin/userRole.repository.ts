import { IUserRoleCreateRepository } from "../../../domain/admin/userRoleDomain";
import { _config } from "../../../config/config";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import bcrypt from "bcrypt";
import { CreateUserRoleInput } from "../../../api/Request/userRole";
import { UserRoles } from "../../../api/response/userRole.response";
import UserRole from "../../../app/model/user.role";
import { AdminUser } from "../../../api/response/admin.response";
import AdminUsers from "../../../app/model/admin.user";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";



class UserRoleRepository implements IUserRoleCreateRepository {
    private db: any;

    constructor(db: any) {
        this.db = db;
    }



    async createUserRole(
        userData: CreateUserRoleInput
    ): Promise<any> {
        try {
            const userRole: any = new UserRole();
            userRole.roleName = userData.roleName
            userRole.rolePermissions = userData.rolePermissions;
            userRole.createdBy = new Types.ObjectId(userData.createdBy);
            userRole.modifiedBy = new Types.ObjectId(userData.modifiedBy);

            const result = await UserRole.create(userRole);
            if (result) {
                return successResponse("Success", StatusCodes.OK, result);

            }

        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to create user"
            );
        }
    }


    async getAllUserRole(params: { page: number; limit: number; search?: string }): Promise<PaginationResult<UserRoles[]> | ErrorResponse> {
        try {
            const { page, limit, search } = params;
            const matchStage: any = { isDelete: false };

            if (search) {
                matchStage.roleName = { $regex: search, $options: 'i' };
            }

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $project: {
                        password: 0 // exclude password field
                    }
                },
                { $skip: page * limit }, // ✅ correct skip formula
                { $limit: limit }
            ];

            const roles = await UserRole.aggregate(pipeline);
            const count = await UserRole.countDocuments(matchStage);

            return Pagination(count, roles, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                error.message || "Unknown error"
            );
        }
    }

    async getUserRoleById(id: string): Promise<ApiResponse<any> | ErrorResponse> {

        try {
            const user = await UserRole.findOne({ _id: id, isDelete: false }).select('-password');

            if (!user) {
                return createErrorResponse(
                    "An unexpected error occurred",
                    500,
                );
            }

            return successResponse("Success", StatusCodes.OK, user);

        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                error.message || "Unknown error"
            );
        }
    }

    async updateUserRole(id: string, userData: Partial<CreateUserRoleInput>): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Check if user exists
            const existingUser = await UserRole.findOne({ _id: id, isDelete: false });

            // Update user
            const updatedUser = await UserRole.findByIdAndUpdate(
                id,
                {
                    ...userData,
                    modifiedBy: new Types.ObjectId(userData.modifiedBy),
                    updatedAt: new Date()
                },
                { new: true }
            );
            console.log("update user", updatedUser)
            if (!updatedUser) {

                return createErrorResponse(
                    "error",
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to update user"
                );
            }
            if (existingUser?.roleName !== userData.roleName) {
                const users = await AdminUsers.updateMany({
                    role: existingUser?.roleName
                }, {
                    $set: {
                        role: userData.roleName ?? existingUser?.roleName
                    }
                });
            }

            return successResponse(
                "User updated successfully",
                StatusCodes.OK,
                updatedUser
            );
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to update user"
            );
        }
    }

    async deleteUserRole(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            console.log('ooooooooooo')
            // Check if user exists
            const existingUser = await UserRole.findOne({ _id: id, isDelete: false });


            // Update user
            const updatedUser = await AdminUsers.findByIdAndUpdate(
                id,
                {

                    isDelete: true
                },
                { new: true }
            );

            if (!updatedUser) {
                return createErrorResponse(
                    "error",
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to update user"
                );
            }

            return successResponse(
                "User updated successfully",
                StatusCodes.OK,
                updatedUser
            );
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to update user"
            );
        }
    }

}
export function newUserRoleRepository(db: any): IUserRoleCreateRepository {
    return new UserRoleRepository(db);
}
