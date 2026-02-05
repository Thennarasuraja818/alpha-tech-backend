import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { AdminUser } from "../../../api/response/admin.response";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import bcrypt from "bcrypt";
import { _config } from "../../../config/config";
import { IWebsiteUserRepository } from "../../../domain/website/user.domain";
import Users from "../../../app/model/user";
import jwt from "jsonwebtoken";
import {
  CreateUserInput,
  LoginWebsiteInput,
} from "../../../api/Request/website.user";
import UserToken from "../../../app/model/user.token";
import { CreateUserMobileApp } from "../../../api/Request/mobileAppUser";
class WebSiteUserRepository implements IWebsiteUserRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }
  async loginUser(
    data: LoginWebsiteInput
  ): Promise<ApiResponse<{ user: AdminUser; token: string }> | ErrorResponse> {
    try {
      // Step 1: Check if user exists
      const adminExist = await Users.findOne({
        phone: data.phone,
        isActive: 1,
        isDelete: 0,
      });

      if (!adminExist) {
        return createErrorResponse("Admin email doesn't exist", 400);
      }

      //   // Step 2: Verify password
      //   const passwordValid = await bcrypt.compare(data.password, adminExist.password);
      //   if (!passwordValid) {
      //     return createErrorResponse("Incorrect password", 400);
      //   }

      // Step 3: Ensure secret key exists
      if (!_config?.JwtSecretKey) {
        return createErrorResponse(
          "Server configuration error: Secret key is missing",
          500
        );
      }

      // Step 4: Generate JWT token
      const token = jwt.sign(
        {
          id: adminExist._id,
          email: adminExist.email,
          name: adminExist.name,
        },
        _config.JwtSecretKey,
        { expiresIn: "1h" }
      );

      // Step 5: Save or update token
      const existingToken = await UserToken.findOne({ userId: adminExist._id });
      if (existingToken) {
        existingToken.token = token;
        await existingToken.save();
      } else {
        await UserToken.create({ userId: adminExist._id, token });
      }

      // Step 6: Build and return response
      const user: any = {
        name: adminExist.name,
        email: adminExist.email ?? '',
        isActive: adminExist.isActive,
        isDelete: adminExist.isDelete,
        phone: adminExist.phone
      };

      return successResponse("Login successful", StatusCodes.OK, { user, token });

    } catch (error: any) {
      return createErrorResponse(
        "An unexpected error occurred",
        500,
        error.message || "Failed to log in"
      );
    }
  }

  async findUserByEmail(
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
  findAdminById(id: string): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    throw new Error("Method not implemented.");
  }

  // Password management
  async createUser(
    data: CreateUserInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userData = await Users.findOne({ email: data.email });

      if (userData) {
        return createErrorResponse(
          "Email Id is already exist!!",
          StatusCodes.BAD_REQUEST,
          "Email Id is already exist!!"
        );
      }

      const user = await Users.create({
        name: data.name,
        email: data.email,
        // userName: data.userName,
        // password: await bcrypt.hash(data.password, 10),
      });
      console.log(user, "useruser");
      return successResponse("User created successfully", StatusCodes.OK, user);
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }
  async deleteUser(
    data: CreateUserInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userData = await Users.findOne({ email: data.email });

      if (userData) {
        return createErrorResponse(
          "Email Id is already exist!!",
          StatusCodes.BAD_REQUEST,
          "Email Id is already exist!!"
        );
      }

      const user = await Users.create({
        name: data.name,
        email: data.email,
        // userName: data.userName,
        // password: await bcrypt.hash(data.password, 10),
      });
      console.log(user, "useruser");
      return successResponse("User created successfully", StatusCodes.OK, user);
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }
  async updateUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userData = await Users.findOne({ phone: data.phone, isActive: 1, isDelete: 0 });

      if (!userData) {
        return createErrorResponse(
          "User not found",
          StatusCodes.BAD_REQUEST,
          "User not found"
        );
      }
      const checkDup = await Users.findOne({ _id: { $ne: userData._id }, phone: data.phone, isActive: 1, isDelete: 0 });
      if (checkDup) {
        return createErrorResponse(
          "User is already exist based on given phone number",
          StatusCodes.BAD_REQUEST,
          "User is already exist based on given phone number"
        );
      }
      const user = await Users.updateOne({ _id: userData._id }, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        lastName: data.lastName
      });
      return successResponse("User updated successfully", StatusCodes.OK, { user });
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }
}

export function newWebsiteUserRepository(db: any): IWebsiteUserRepository {
  return new WebSiteUserRepository(db);
}
