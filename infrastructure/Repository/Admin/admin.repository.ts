import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { User } from "../../../api/response/user.response";
import { AdminUser } from "../../../api/response/admin.response";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { IAdminRepository } from "../../../domain/admin/adminDomain";
import {
  CreateAdminInput,
  LoginAdminInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "../../../api/Request/admin";
import Admin from "../../../app/model/admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "process";
import AdminToken from "../../../app/model/admin.token";
import { _config } from "../../../config/config";
import mailService from "../../../utils/common/mail.service";
import AdminUsers from "../../../app/model/admin.user";
import UserRole from "../../../app/model/user.role";

class AdminUserRepository implements IAdminRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async findAdminByEmail(
    email: string
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    try {
      const userDtl = await this.db.collection("admins").findOne({
        email: email,
        isActive: true,
      });

      if (!userDtl) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found in the database."
        );
      }

      // Map MongoDB document to User type
      const user: AdminUser = {
        name: userDtl.name,
        email: userDtl.email,
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

  async findAdminById(id: string): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    try {
      let userDtl: any = await Admin.findOne({
        _id: new Types.ObjectId(id),
        isActive: true,
      });

      if (!userDtl) {
        userDtl = await AdminUsers.findOne({
          _id: new Types.ObjectId(id),
          isActive: true,
        });
      }

      if (!userDtl) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No admin with the given ID found in the database."
        );
      }
      if (userDtl.roleId) {
        const userpermission = await UserRole.findOne({
          _id: userDtl.roleId,
          isDelete: false,
        });
        if (userpermission) {
          userDtl.role = userpermission;
          userDtl.permission = userpermission.rolePermissions;
        }
      }
      // Map MongoDB document to AdminUser type
      const user: AdminUser = {
        name: userDtl?.name,
        email: userDtl?.email,
        role: userDtl?.role,
        phoneNumber: userDtl?.phoneNumber,
        userId: userDtl?.userId,
        isActive: userDtl?.isActive,
        isDelete: userDtl?.isDelete,
        type: userDtl?.type,
        permissions: userDtl?.permission,
        profileImage: userDtl?.profileImage
      };

      if (!user.isActive) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "The admin is inactive and cannot be processed."
        );
      }

      if (user.isDelete) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Admin is in deleted state."
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

  async findUserByEmail(
    email: string
  ): Promise<ApiResponse<User> | ErrorResponse> {
    try {
      const userDtl = await this.db.collection("users").findOne({
        email: email,
        isActive: true,
      });

      if (!userDtl) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found in the database."
        );
      }

      // Map MongoDB document to User type
      const user: User = {
        name: userDtl.name,
        email: userDtl.email,
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

  async createAdmin(
    userData: CreateAdminInput
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    try {
      const findEmail = await Admin.findOne({
        email: userData.email,
        isDelete: 0,
      });

      if (findEmail) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "User email is exist"
        );
      }
      const hasPass = await bcrypt.hash(userData.password, 10);
      const user = new Admin();
      user.email = userData.email;
      user.password = hasPass;
      user.name = userData.name;
      const result = await Admin.create(user);
      if (result) {
        const adminUser: AdminUser = {
          name: result.name,
          email: result.email,
          isActive: result.isActive,
          isDelete: result.isDelete,
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
  async loginAdmin(
    userData: LoginAdminInput
  ): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse> {
    try {
      let adminExist: any = null;

      if (userData.email) {
        console.log("Checking by email");
        adminExist = await Admin.findOne({
          email: userData.email,
          isActive: true,
          isDelete: false,
        });
        if (!adminExist) {
          return createErrorResponse("Admin email doesn't exist", 400);
        }
      }

      if (!adminExist && userData.phoneNumber) {
        console.log("Checking by phone number");
        adminExist = await AdminUsers.findOne({
          phoneNumber: userData.phoneNumber,
          isActive: true,
          isDelete: false,
        });
        console.log("Admin found by phone number:", adminExist);
        if (!adminExist) {
          return createErrorResponse("Admin phone number doesn't exist", 400);
        }
      }

      if (!userData.email && !userData.phoneNumber) {
        return createErrorResponse("Email or phone number is required", 400);
      }
      const checkPass = await bcrypt.compare(
        userData.password,
        adminExist.password
      );
      if (!checkPass) {
        return createErrorResponse("Incorrect password", 400);
      }
      if (!_config?.JwtSecretKey) {
        return createErrorResponse(
          "Server configuration error: Secret key is missing",
          500
        );
      }
      // Generate JWT (1h expiry)
      const token = jwt.sign(
        { id: adminExist._id, email: adminExist.email, name: adminExist.name },
        _config?.JwtSecretKey,
        { expiresIn: _config.TokenDuration }
      );
      // Upsert token in admintokens
      const existing = await AdminToken.findOne({ adminId: adminExist._id });
      // if (existing) {
      //   existing.token = token;
      //   await existing.save();
      // } else {
      await AdminToken.create({ adminId: adminExist._id, token });
      // }
      const user: AdminUser = {
        name: adminExist.name,
        email: adminExist.email,
        isActive: adminExist.isActive,
        isDelete: adminExist.isDelete,
      };
      return successResponse("Login successful", StatusCodes.OK, {
        user,
        token,
      });
    } catch (error: any) {
      return createErrorResponse(
        "An unexpected error occurred",
        500,
        error.message || "Failed to create user"
      );
    }
  }

  // Request password reset: generate and store reset token
  async forgotPassword(
    data: ForgotPasswordInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const admin = await Admin.findOne({
        email: data.email,
        isActive: 1,
        isDelete: 0,
      });
      if (!admin) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No admin with that email"
        );
      }
      if (!_config?.JwtSecretKey) {
        return createErrorResponse(
          "error",
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Missing secret key"
        );
      }
      const resetToken = jwt.sign({ id: admin._id }, _config.JwtSecretKey, {
        expiresIn: "1h",
      });
      // upsert reset token
      const existing = await AdminToken.findOne({ adminId: admin._id });
      if (existing) {
        existing.token = resetToken;
        await existing.save();
      } else {
        await AdminToken.create({ adminId: admin._id, token: resetToken });
      }
      const link = `${_config?.WebsiteUrl}/reset-password?token=${resetToken}`;
      mailService.commonMailSend(
        "Forgot Password",
        data.email,
        "Reset link sended successfully.Please check your email",
        { name: admin?.name, link }
      );
      return successResponse("Reset token generated", StatusCodes.OK, {
        token: resetToken,
      });
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }

  // Reset password using token
  async resetPassword(
    data: ResetPasswordInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      if (!_config?.JwtSecretKey) {
        return createErrorResponse(
          "error",
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Missing secret key"
        );
      }
      const decoded: any = jwt.verify(data.token, _config.JwtSecretKey);
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Invalid token"
        );
      }
      const hashed = await bcrypt.hash(data.newPassword, 10);
      admin.password = hashed;
      await admin.save();
      await AdminToken.deleteOne({ adminId: admin._id });
      return successResponse("Password reset successful", StatusCodes.OK, null);
    } catch (err: any) {
      return createErrorResponse("error", StatusCodes.BAD_REQUEST, err.message);
    }
  }

  // Change password when logged in
  async changePassword(
    id: string,
    data: ChangePasswordInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const admin = await Admin.findById(id);
      if (!admin) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Admin not found"
        );
      }
      const match = await bcrypt.compare(data.oldPassword, admin.password);
      if (!match) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Old password incorrect"
        );
      }
      const hashed = await bcrypt.hash(data.newPassword, 10);
      admin.password = hashed;
      await admin.save();
      // Invalidate all existing tokens for this admin
      await AdminToken.updateMany(
        { adminId: id, isActive: true },
        {
          // isActive: false,
          // isDelete: true,
          token: "",
        }
      );

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
  async checkMobileNumber(phoneNumber: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      // Check if phone number exists in adminusers collection
      const adminUser = await this.db.collection("adminusers").findOne({
        phoneNumber: phoneNumber,
        isActive: true,
        isDelete: false
      });

      if (!adminUser) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No admin user with this phone number found"
        );
      }

      return successResponse(
        "Phone number verified successfully",
        StatusCodes.OK,
        { exists: true, userId: adminUser._id }
      );
    } catch (error: any) {
      return createErrorResponse(
        "An unexpected error occurred",
        500,
        error.message || "Failed to check phone number"
      );
    }
  }
  async changePasswordByUserId(
    userId: string,
    newPassword: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      // Convert string ID to ObjectId
      const objectId = new Types.ObjectId(userId);

      // Find the admin user by ID
      const admin = await AdminUsers.findOne({
        _id: objectId,
        isActive: true,
        isDelete: false
      });

      if (!admin) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Admin user not found or inactive"
        );
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password
      const result = await AdminUsers.updateOne(
        { _id: objectId },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );

      if (result.modifiedCount === 0) {
        return createErrorResponse(
          "error",
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to update password"
        );
      }

      return successResponse(
        "Password changed successfully",
        StatusCodes.OK,
        null
      );
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message || "Failed to change password"
      );
    }
  }


}

export function newAdminUserRepository(db: any): IAdminRepository {
  return new AdminUserRepository(db);
}
