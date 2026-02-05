import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { User } from "../../../api/response/user.response";
import { AdminUser } from "../../../api/response/admin.response";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { IUserCreateRepository } from "../../../domain/admin/userDomain";
import { CreateUserInput, ResetPasswordSchema, UserlistSchema, ChangePasswordInput, ChangePasswordAfterVerificationInput, VerifyOtpInput } from "../../../api/Request/user";

import Admin from "../../../app/model/admin.user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { _config } from "../../../config/config";
import { Types } from "mongoose";
import AdminUsers from "../../../app/model/admin.user";
import { MobileLoginInput } from "../../../api/Request/mobileAppUser";
import UserToken from "../../../app/model/user.token";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import AdminUserActivityLog from "../../../app/model/Admin.User.Activity";
import { logAdminUserActivity } from "../../../app/model/mobile.otp";
import Users from "../../../app/model/user";
import { RootModel } from "../../../app/model/root";
import { Uploads } from "../../../utils/uploads/image.upload";

class UserRepository implements IUserCreateRepository {
    private db: any;

    constructor(db: any) {
        this.db = db;
    }

    async findUserByEmail(
        phone: string
    ): Promise<ApiResponse<User> | ErrorResponse> {
        try {
            const userDtl = await AdminUsers.findOne({ phoneNumber: phone });

            if (!userDtl) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }

            // Map MongoDB document to User type
            const user = {
                name: userDtl.name,
                email: userDtl.email,
                phone: userDtl.phoneNumber,
                isActive: userDtl.isActive,
                isDelete: userDtl.isDelete,
            };

            if (!user.isActive) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "The user is inactive and cannot be processed."
                );
            }

            if (user.isDelete) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "User is in deleted state."
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
    async createUser(
        userData: CreateUserInput,
        profileImg?: any
    ): Promise<ApiResponse<User> | ErrorResponse> {
        try {
            const findEmail = await AdminUsers.findOne({
                email: userData.email,
                isDelete: false,
            });

            if (findEmail) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "User email is exist"
                );
            }
            const findPhoneNumber = await AdminUsers.findOne({
                phoneNumber: userData.phoneNumber,
                isDelete: false,
            });

            if (findPhoneNumber) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "Phone Number is Already exist"
                );
            }

            if (userData.aadhar) {
                const findAadhar = await AdminUsers.findOne({
                    aadhar: userData.aadhar,
                    isDelete: false,
                });

                if (findAadhar) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Aadhar number already exists"
                    );
                }
            }

            // Check if emergency contact number already exists
            if (userData.emergencyContactNumber) {
                const findEmergencyContact = await AdminUsers.findOne({
                    emergencyContactNumber: userData.emergencyContactNumber,
                    isDelete: false,
                });

                if (findEmergencyContact) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Emergency contact number already exists"
                    );
                }
            }

            // Check if account number already exists
            if (userData.accountNumber) {
                const findAccountNumber = await AdminUsers.findOne({
                    accountNumber: userData.accountNumber,
                    isDelete: false,
                });

                if (findAccountNumber) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Account number already exists"
                    );
                }
            }

            // Process profile image
            let profileImagePath = "";
            console.log(profileImg, "profileImg");

            if (profileImg) {
                const profileImageDtls = await Uploads.processFiles([profileImg], "users", 'img', '', '');
                if (profileImageDtls && profileImageDtls.length > 0) {
                    profileImagePath = profileImageDtls[0]; // Assuming processFiles returns array of paths
                }
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new AdminUsers({
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                roleId: new Types.ObjectId(userData.roleId),
                phoneNumber: userData.phoneNumber,
                createdBy: new Types.ObjectId(userData.createdBy),
                modifiedBy: new Types.ObjectId(userData.modifiedBy),
                userId: userData.userId,
                aadhar: userData.aadhar,
                dateOfJoining: userData.dateOfJoining,
                dateOfBirth: userData.dateOfBirth,
                salary: userData.salary,
                salesWithCollection: userData?.salesWithCollection ?? false,

                // New fields
                bloodGroup: userData.bloodGroup,
                permanentAddress: userData.permanentAddress,
                presentAddress: userData.presentAddress,
                emergencyContactNumber: userData.emergencyContactNumber,
                relationship: userData.relationship,
                bankName: userData.bankName,
                ifscCode: userData.ifscCode,
                branch: userData.branch,
                accountNumber: userData.accountNumber,
                profileImage: profileImagePath,
                orderStatusChangePermission: userData.orderStatusChangePermission ?? false,
                cashHandoverUser: userData.cashHandoverUser ?? false,
                returnOrderCollectedUser: userData.returnOrderCollectedUser ?? false,
            });

            const result = await AdminUsers.create(user);
            if (result) {
                const adminUser: AdminUser = {
                    name: result.name,
                    email: result.email,
                    isActive: result.isActive,
                    isDelete: result.isDelete,
                    phoneNumber: result.phoneNumber ?? undefined,
                    profileImage: result.profileImage
                };
                return successResponse("Success", StatusCodes.OK, adminUser);
            }
            return createErrorResponse(
                "error",
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to create user"
            );
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                error.message || "Failed to create user"
            );
        }
    }

    async updateUser(
        id: string,
        userData: Partial<CreateUserInput>,
        profileImg?: any
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Check if user exists
            const existingUser = await AdminUsers.findOne({ _id: id, isDelete: false });
            if (!existingUser) {
                return createErrorResponse(
                    "error",
                    StatusCodes.NOT_FOUND,
                    "User not found"
                );
            }
            console.log(existingUser, "existingUser");
            console.log(userData, "userData");

            // If email is being updated, check for duplicates
            if (userData.email && userData.email !== existingUser.email) {
                const emailExists = await AdminUsers.findOne({
                    email: userData.email,
                    isDelete: false,
                    _id: { $ne: id }
                });
                if (emailExists) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Email already in use"
                    );
                }
            }
            if (userData.phoneNumber && userData.phoneNumber !== existingUser.phoneNumber) {
                const phoneExists = await AdminUsers.findOne({
                    phoneNumber: userData.phoneNumber,
                    isDelete: false,
                    _id: { $ne: id }
                });
                if (phoneExists) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Phone already in use"
                    );
                }
            }

            // Check if aadhar is being updated and exists
            if (userData.aadhar && userData.aadhar !== existingUser.aadhar) {
                const aadharExists = await AdminUsers.findOne({
                    aadhar: userData.aadhar,
                    isDelete: false,
                    _id: { $ne: id },
                });
                if (aadharExists) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Aadhar number already in use"
                    );
                }
            }

            // Check if emergency contact number is being updated and exists
            if (userData.emergencyContactNumber && userData.emergencyContactNumber !== existingUser.emergencyContactNumber) {
                const emergencyContactExists = await AdminUsers.findOne({
                    emergencyContactNumber: userData.emergencyContactNumber,
                    isDelete: false,
                    _id: { $ne: id },
                });
                if (emergencyContactExists) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Emergency contact number already in use"
                    );
                }
            }

            // Check if account number is being updated and exists
            if (userData.accountNumber && userData.accountNumber !== existingUser.accountNumber) {
                const accountNumberExists = await AdminUsers.findOne({
                    accountNumber: userData.accountNumber,
                    isDelete: false,
                    _id: { $ne: id },
                });
                if (accountNumberExists) {
                    return createErrorResponse(
                        "error",
                        StatusCodes.BAD_REQUEST,
                        "Account number already in use"
                    );
                }
            }
            console.log(profileImg, "profileImg22");

            // Process profile image if provided
            let profileImagePath = existingUser.profileImage;
            console.log(profileImagePath, "profileImagePath");

            if (profileImg) {
                const profileImageDtls = await Uploads.processFiles([profileImg], "users", 'img', '', '');
                console.log(profileImageDtls, "profileImageDtls");

                if (profileImageDtls && profileImageDtls.length > 0) {
                    profileImagePath = profileImageDtls[0];
                }
            }
            console.log(profileImagePath, "profileImageDtls");

            // Hash password if it's being updated
            if (userData.password) {
                userData.password = await bcrypt.hash(userData.password, 10);
            }

            // Update user
            const updatedUser = await AdminUsers.findByIdAndUpdate(
                id,
                {
                    ...userData,
                    profileImage: profileImagePath,
                    modifiedBy: new Types.ObjectId(userData.modifiedBy),
                    updatedAt: new Date()
                },
                { new: true }
            ).select('-password');

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

    async getAllInactiveUsers(
        params: UserlistSchema
    ): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, role } = params;

            const matchStage: any = {
                isActive: false,
                isDelete: false
            };

            if (search) {
                matchStage.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ];
            }

            const roleFilter = role

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'role'
                    }
                },
                { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
                ...(roleFilter ? [{
                    $match: {
                        'role.roleName': { $regex: roleFilter, $options: 'i' }
                    }
                }] : []),
                {
                    $project: {
                        _id: 1,
                        isDelete: 1,
                        isActive: 1,
                        email: 1,
                        name: 1,
                        phoneNumber: 1,
                        createdBy: 1,
                        modifiedBy: 1,
                        userId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        role: {
                            _id: '$role._id',
                            roleName: '$role.roleName',
                            isActive: '$role.isActive'
                        },
                        roleId: 1,
                        salesWithCollection: 1,
                        orderStatusChangePermission: 1,
                        cashHandoverUser: 1,
                        returnOrderCollectedUser: 1,
                    }
                },
                { $skip: (page) * limit },
                { $limit: limit }
            ];
            const userDtls = await AdminUsers.aggregate(pipeline);
            const count = await AdminUsers.countDocuments(matchStage);
            console.log(userDtls, "userDtls");

            return Pagination(count, userDtls, limit, page);
        } catch (error: any) {
            console.error('Error in getAllUsers:', error);
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to fetch users"
            );
        }
    }

    async getAllActiveUsers(
        params: UserlistSchema
    ): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, role } = params;

            // Base match
            const matchStage: any = {
                isActive: true,
                isDelete: false
            };

            // Search filter
            if (search) {
                matchStage.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ];
            }

            const roleFilter = role;

            // Aggregation pipeline with $facet
            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'role'
                    }
                },
                { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
                ...(roleFilter ? [{
                    $match: {
                        'role.roleName': { $regex: roleFilter, $options: 'i' }
                    }
                }] : []),
                {
                    $project: {
                        _id: 1,
                        isDelete: 1,
                        isActive: 1,
                        email: 1,
                        name: 1,
                        phoneNumber: 1,
                        createdBy: 1,
                        modifiedBy: 1,
                        userId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        role: {
                            _id: '$role._id',
                            roleName: '$role.roleName',
                            isActive: '$role.isActive'
                        },
                        roleId: 1
                    }
                },
                {
                    $facet: {
                        data: [
                            { $skip: page * limit },
                            { $limit: limit }
                        ],
                        totalCount: [
                            { $count: 'count' }
                        ]
                    }
                }
            ];

            const result = await AdminUsers.aggregate(pipeline);

            const users = result[0]?.data || [];
            const count = result[0]?.totalCount[0]?.count || 0;

            return Pagination(count, users, limit, page);
        } catch (error: any) {
            console.error('Error in getAllUsers:', error);
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to fetch users"
            );
        }
    }
    async getAllUsers(
        params: UserlistSchema
    ): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, role } = params;

            const matchStage: any = {
                isDelete: false
            };

            if (search) {
                matchStage.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                    { emergencyContactNumber: { $regex: search, $options: 'i' } }, // Search in emergency contact
                    { aadhar: { $regex: search, $options: 'i' } }, // Search in aadhar
                    { accountNumber: { $regex: search, $options: 'i' } } // Search in account number
                ];
            }

            const roleFilter = role;

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'role'
                    }
                },
                { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
                ...(roleFilter ? [{
                    $match: {
                        'role.roleName': { $regex: roleFilter, $options: 'i' }
                    }
                }] : []),
                {
                    $project: {
                        _id: 1,
                        isDelete: 1,
                        isActive: 1,
                        email: 1,
                        name: 1,
                        phoneNumber: 1,
                        createdBy: 1,
                        modifiedBy: 1,
                        userId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        role: {
                            _id: '$role._id',
                            roleName: '$role.roleName',
                            isActive: '$role.isActive'
                        },
                        roleId: 1,
                        salesWithCollection: 1,
                        aadhar: 1,
                        dateOfBirth: 1,
                        dateOfJoining: 1,
                        salary: 1,

                        // New fields - include all
                        bloodGroup: 1,
                        permanentAddress: 1,
                        presentAddress: 1,
                        emergencyContactNumber: 1,
                        relationship: 1,
                        bankName: 1,
                        ifscCode: 1,
                        branch: 1,
                        accountNumber: 1,
                        profileImage: 1,
                        orderStatusChangePermission: 1,
                        cashHandoverUser: 1,
                        returnOrderCollectedUser: 1
                    }
                },
                { $skip: (page) * limit },
                { $limit: limit }
            ];

            const userDtls = await AdminUsers.aggregate(pipeline);
            const count = await AdminUsers.countDocuments(matchStage);

            return Pagination(count, userDtls, limit, page);
        } catch (error: any) {
            console.error('Error in getAllUsers:', error);
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to fetch users"
            );
        }
    }

    async getUserSearch(
        params: UserlistSchema
    ): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, search, role } = params;
            const roles = ["Salesman", "CRM"]
            const matchStage: any = {
                isDelete: false
            };

            if (search) {
                matchStage.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ];
            }

            // Handle multiple roles (Salesman and CRM)
            let roleFilter: any = [];
            if (roles) {
                // Convert role to array if it's a string, or use as is if it's an array
                const rolesArray = Array.isArray(roles) ? roles : [roles];

                // Filter for specific role names (case-insensitive)
                roleFilter = rolesArray.map(roleName =>
                    new RegExp(roleName, 'i')
                );
            }

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'role'
                    }
                },
                { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
                // Filter by multiple roles if specified
                ...(roleFilter.length > 0 ? [{
                    $match: {
                        'role.roleName': { $in: roleFilter }
                    }
                }] : []),
                {
                    $project: {
                        _id: 1,
                        isDelete: 1,
                        isActive: 1,
                        email: 1,
                        name: 1,
                        phoneNumber: 1,
                        createdBy: 1,
                        modifiedBy: 1,
                        userId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        role: {
                            _id: '$role._id',
                            roleName: '$role.roleName',
                            isActive: '$role.isActive'
                        },
                        roleId: 1
                    }
                },
                { $skip: (page) * limit },
                { $limit: limit }
            ];

            const userDtls = await AdminUsers.aggregate(pipeline);

            // Get total count with the same role filter
            let countPipeline: any[] = [
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'role'
                    }
                },
                { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
                { $match: matchStage }
            ];

            // Add role filter to count pipeline if specified
            if (roleFilter.length > 0) {
                countPipeline.push({
                    $match: {
                        'role.roleName': { $in: roleFilter }
                    }
                });
            }

            countPipeline.push({ $count: 'total' });

            const countResult = await AdminUsers.aggregate(countPipeline);
            const count = countResult.length > 0 ? countResult[0].total : 0;

            return Pagination(count, userDtls, limit, page);
        } catch (error: any) {
            console.error('Error in getAllUsers:', error);
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to fetch users"
            );
        }
    }
    async getUserById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const user = await AdminUsers.findOne({ _id: id, isDelete: false }).select('-password');

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

    // async updateUser(id: string, userData: Partial<CreateUserInput>): Promise<ApiResponse<any> | ErrorResponse> {
    //     try {
    //         // Check if user exists
    //         const existingUser = await AdminUsers.findOne({ _id: id, isDelete: false });
    //         if (!existingUser) {
    //             return createErrorResponse(
    //                 "error",
    //                 StatusCodes.NOT_FOUND,
    //                 "User not found"
    //             );
    //         }

    //         // If email is being updated, check for duplicates
    //         if (userData.email && userData.email !== existingUser.email) {
    //             const emailExists = await AdminUsers.findOne({
    //                 email: userData.email,
    //                 isDelete: false,
    //                 _id: { $ne: id }
    //             });
    //             if (emailExists) {
    //                 return createErrorResponse(
    //                     "error",
    //                     StatusCodes.BAD_REQUEST,
    //                     "Email already in use"
    //                 );
    //             }
    //         }

    //         // Check if aadhar is being updated and exists
    //         if (userData.aadhar && userData.aadhar !== existingUser.aadhar) {
    //             const aadharExists = await AdminUsers.findOne({
    //                 aadhar: userData.aadhar,
    //                 isDelete: false,
    //                 _id: { $ne: id },
    //             });
    //             if (aadharExists) {
    //                 return createErrorResponse(
    //                     "error",
    //                     StatusCodes.BAD_REQUEST,
    //                     "Aadhar number already in use"
    //                 );
    //             }
    //         }

    //         // Check if emergency contact number is being updated and exists
    //         if (userData.emergencyContactNumber && userData.emergencyContactNumber !== existingUser.emergencyContactNumber) {
    //             const emergencyContactExists = await AdminUsers.findOne({
    //                 emergencyContactNumber: userData.emergencyContactNumber,
    //                 isDelete: false,
    //                 _id: { $ne: id },
    //             });
    //             if (emergencyContactExists) {
    //                 return createErrorResponse(
    //                     "error",
    //                     StatusCodes.BAD_REQUEST,
    //                     "Emergency contact number already in use"
    //                 );
    //             }
    //         }

    //         // Check if account number is being updated and exists
    //         if (userData.accountNumber && userData.accountNumber !== existingUser.accountNumber) {
    //             const accountNumberExists = await AdminUsers.findOne({
    //                 accountNumber: userData.accountNumber,
    //                 isDelete: false,
    //                 _id: { $ne: id },
    //             });
    //             if (accountNumberExists) {
    //                 return createErrorResponse(
    //                     "error",
    //                     StatusCodes.BAD_REQUEST,
    //                     "Account number already in use"
    //                 );
    //             }
    //         }

    //         // Hash password if it's being updated
    //         if (userData.password) {
    //             userData.password = await bcrypt.hash(userData.password, 10);
    //         }

    //         // Update user
    //         const updatedUser = await AdminUsers.findByIdAndUpdate(
    //             id,
    //             {
    //                 ...userData,
    //                 modifiedBy: new ObjectId(userData.modifiedBy),
    //                 updatedAt: new Date()
    //             },
    //             { new: true }
    //         ).select('-password');

    //         if (!updatedUser) {
    //             return createErrorResponse(
    //                 "error",
    //                 StatusCodes.INTERNAL_SERVER_ERROR,
    //                 "Failed to update user"
    //             );
    //         }

    //         return successResponse(
    //             "User updated successfully",
    //             StatusCodes.OK,
    //             updatedUser
    //         );
    //     } catch (error: any) {
    //         return createErrorResponse(
    //             "An unexpected error occurred",
    //             StatusCodes.INTERNAL_SERVER_ERROR,
    //             error.message || "Failed to update user"
    //         );
    //     }
    // }

    async deleteUser(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            console.log('ooooooooooo')
            // Check if user exists
            const existingUser = await AdminUsers.findOne({ _id: id, isDelete: false });
            if (!existingUser) {
                return createErrorResponse(
                    "error",
                    StatusCodes.NOT_FOUND,
                    "User not found"
                );
            }

            // Update user
            const updatedUser = await AdminUsers.findByIdAndUpdate(
                id,
                {

                    isDelete: true
                },
                { new: true }
            ).select('-password');

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
    async loginUser(
        data: MobileLoginInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const { phone, pin, fcmToken } = data;

            // 1. Check if user exists
            const adminExist: any = await AdminUsers.findOne({
                phoneNumber: phone,
                isActive: 1,
                isDelete: 0,
            });

            if (!adminExist) {
                return createErrorResponse("User doesn't exist", 400);
            }

            // 2. Verify PIN
            const validPin = await bcrypt.compare(pin, adminExist.password);
            if (!validPin) {
                return createErrorResponse("Incorrect pin", 400);
            }

            // 3. Check secret key
            if (!_config?.JwtSecretKey) {
                return createErrorResponse("Server configuration error: Missing JWT secret", 500);
            }

            // 4. Generate JWT
            const token = jwt.sign(
                {
                    id: adminExist._id,
                    phone: adminExist.phoneNumber
                },
                _config.JwtSecretKey,
                { expiresIn: "7d" }
            );

            if (fcmToken) {
                if (adminExist.fcmToken !== fcmToken) {
                    adminExist.fcmToken = fcmToken;
                    await adminExist.save();
                }
            }

            const existingToken = await UserToken.findOne({ userId: adminExist._id });
            if (existingToken) {
                existingToken.token = token;
                await existingToken.save();
            } else {
                await UserToken.create({ userId: adminExist._id, token });
            }

            // 7. Fetch user route (salesman/deliveryman)
            const route: any = await RootModel.findOne({
                $or: [
                    { salesman: adminExist._id },
                    { deliveryman: adminExist._id }
                ],
                isActive: 1,
                isDelete: 0
            });

            // 8. Build response user object
            const user: any = {
                _id: adminExist._id,
                name: adminExist.name,
                email: adminExist.email,
                isActive: adminExist.isActive,
                isDelete: adminExist.isDelete,
                phone: adminExist.phoneNumber ?? "",
                fcmToken: adminExist.fcmToken ?? null,
                route
            };

            // 9. Success response
            return successResponse("Login successful", StatusCodes.OK, { user, token });

        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                error.message || "Failed to log in"
            );
        }
    }


    async resetPassword(
        id: string,
        data: ResetPasswordSchema
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const admin: any = await AdminUsers.findOne({ email: id, isDelete: false });
            if (!admin) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "User not found"
                );
            }

            // Check if oldPin and newPin are the same (plain text)
            if (data.newPin !== data.conformPin) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "New pin and conform pin must be the same"
                );
            }
            const hashed = await bcrypt.hash(data.newPin, 10);
            admin.password = hashed;
            await admin.save();
            return successResponse(
                "Password changed successfully",
                StatusCodes.OK,
                null
            );
        } catch (err: any) {
            return createErrorResponse(
                "error",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async changePassword(
        id: string,
        data: ChangePasswordInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // console.log("Received data:", { id, ...data });

            const admin = await AdminUsers.findById(id);
            if (!admin) {
                console.log("Admin not found");
                return createErrorResponse(
                    "User not found",
                    StatusCodes.NOT_FOUND,
                    "User not found"
                );
            }

            // Debug: Log the stored hash and comparison
            // console.log("Stored hash:", admin.password);
            // console.log("Comparing with old PIN:", data.oldPin);

            const isMatch = await bcrypt.compare(data.oldPin, admin.password);
            // console.log("Comparison result:", isMatch);

            if (!isMatch) {
                // Additional debug: Try to hash the input to see what it would look like
                const tempHash = await bcrypt.hash(data.oldPin, 10);
                // console.log("If we hashed the old PIN now:", tempHash);

                return createErrorResponse(
                    "Old PIN is incorrect",
                    StatusCodes.BAD_REQUEST,
                    "Old PIN is incorrect"
                );
            }

            if (data.oldPin === data.newPin) {
                return createErrorResponse(
                    "Invalid request",
                    StatusCodes.BAD_REQUEST,
                    "New PIN must be different from old PIN"
                );
            }

            const hashedPassword = await bcrypt.hash(data.newPin, 10);
            admin.password = hashedPassword;
            await admin.save();

            // console.log("Password changed successfully");
            return successResponse(
                "Password changed successfully",
                StatusCodes.OK,
                data
            );
        } catch (err: any) {
            console.error("Error in changePassword:", err);
            return createErrorResponse(
                "Server error",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async userLogList(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, type, search } = params;

            const matchStage: any = {
                isActive: true,
                isDelete: false,
            };

            if (search) {
                matchStage.userName = { $regex: search, $options: 'i' };
            }

            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'adminusers',
                    },
                },
                {
                    $project: {
                        name: { $arrayElemAt: ['$adminusers.name', 0] },
                        actionPerformed: 1,
                        ipAddress: 1,
                        deviceUsed: 1,
                        createdAt: 1
                    }
                }
            ];

            // COUNT pipeline
            const countPipeline = [...pipeline, { $count: 'count' }];
            const countResult = await AdminUserActivityLog.aggregate(countPipeline);
            const count = countResult[0]?.count ?? 0;

            // PAGINATION (only if type !== 'all' and valid page/limit are provided)
            if (type !== 'all' && page !== undefined && limit !== undefined && limit > 0) {
                pipeline.push({ $skip: page * limit }, { $limit: limit });
            }

            const result = await AdminUserActivityLog.aggregate(pipeline);

            return Pagination(count, result, limit ?? 0, page ?? 0);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving products',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getAllCustomer(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        try {
            const { page, limit, type, search } = params;

            const matchStage: any = {
                isActive: true,
                isDelete: false,
            };

            if (search) {
                matchStage.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }


            const pipeline: any[] = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'usertokens',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'usertokens',
                    },
                },
                {
                    $project: {
                        lastLogin: { $arrayElemAt: ['$usertokens.updatedAt', 0] },
                        name: 1,
                        email: 1,
                        isDelete: 1,
                        isActive: 1,
                        isVerfied: 1,
                        phone: 1,
                        address: 1,
                        pincode: 1,
                        createdBy: 1,
                        modifiedBy: 1,
                        lastName: 1,
                        createdAt: 1
                    }
                }
            ];

            // COUNT pipeline
            const countPipeline = [...pipeline, { $count: 'count' }];
            const countResult = await Users.aggregate(countPipeline);
            const count = countResult[0]?.count ?? 0;

            // PAGINATION (only if type !== 'all' and valid page/limit are provided)
            if (type !== 'all' && page !== undefined && limit !== undefined && limit > 0) {
                pipeline.push({ $skip: page * limit }, { $limit: limit });
            }

            const result = await Users.aggregate(pipeline);

            return Pagination(count, result, limit ?? 0, page ?? 0);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving products',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    // Add these methods to your UserRepository class
    // Add these methods to your UserRepository class
    // In your UserRepository class - OTP Verification
    async verifyOtp(
        data: VerifyOtpInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Static OTP validation
            if (data.otp !== "1234") {
                return createErrorResponse(
                    "Invalid OTP",
                    StatusCodes.BAD_REQUEST,
                    "error"
                );
            }

            // Check if user exists with this phone number
            const user = await AdminUsers.findOne({
                phoneNumber: data.phoneNumber,
                isActive: true,
                isDelete: false
            });

            if (!user) {
                return createErrorResponse(
                    "error",
                    StatusCodes.NOT_FOUND,
                    "User not found with this phone number"
                );
            }

            return successResponse(
                "OTP verified successfully",
                StatusCodes.OK,
                {
                    verified: true,
                    userId: user._id,
                    userPhone: user.phoneNumber
                }
            );
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to verify OTP"
            );
        }
    }

    // In your UserRepository class
    // In your UserRepository class - Password Change with Token
    async changePasswordAfterVerification(
        data: ChangePasswordAfterVerificationInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Find user by ID
            const user = await AdminUsers.findOne({
                _id: new Types.ObjectId(data.userId),
                isActive: true,
                isDelete: false
            });

            if (!user) {
                return createErrorResponse(
                    "error",
                    StatusCodes.NOT_FOUND,
                    "User not found"
                );
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            // Update password
            user.password = hashedPassword;
            await user.save();

            // Log activity
            await logAdminUserActivity(user._id, null, user.email, 'Password Changed after OTP Verification');

            // Generate new JWT token (same as login)
            if (!_config?.JwtSecretKey) {
                return createErrorResponse(
                    "Server configuration error: Secret key is missing",
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Server configuration error"
                );
            }

            const token = jwt.sign(
                {
                    id: user._id,
                    phone: user.phoneNumber
                },
                _config.JwtSecretKey,
                { expiresIn: '7d' }
            );

            // Save or update token (same as login)
            const existingToken = await UserToken.findOne({ userId: user._id });
            if (existingToken) {
                existingToken.token = token;
                existingToken.updatedAt = new Date();
                await existingToken.save();
            } else {
                await UserToken.create({
                    userId: user._id,
                    token,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Get route information (same as login)
            const route: any = await RootModel.findOne({
                $or: [
                    { salesman: user._id },
                    { deliveryman: user._id }
                ],
                isActive: 1,
                isDelete: 0
            });

            // Build user response in the same format as login
            const userResponse: any = {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                isDelete: user.isDelete,
                phone: user.phoneNumber ?? '',
                route
            };

            return successResponse(
                "Password changed successfully",
                StatusCodes.OK,
                {
                    user: userResponse,
                    token: token
                }
            );
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to change password"
            );
        }
    }

    async getPincodes(
        userId: string
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Find user by ID
            const user = await AdminUsers.findOne({
                _id: new Types.ObjectId(userId),
                isActive: true,
                isDelete: false
            });

            if (!user) {
                return createErrorResponse(
                    "error",
                    StatusCodes.NOT_FOUND,
                    "User not found"
                );
            }

            // Get route information (same as login)
            const route: any = await RootModel.findOne({
                $or: [
                    { salesman: user._id },
                    { deliveryman: user._id }
                ],
                isActive: 1,
                isDelete: 0
            });

            // Build user response in the same format as login
            return successResponse(
                "Routes details got successfully",
                StatusCodes.OK,
                route
            );
        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message || "Failed to change password"
            );
        }
    }

}


export function newUserRepository(db: any): IUserCreateRepository {
    return new UserRepository(db);
}
