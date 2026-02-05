import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { AdminUser } from "../../../api/response/admin.response";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import bcrypt from "bcrypt";
import { _config } from "../../../config/config";
import Users from "../../../app/model/user";
import jwt from "jsonwebtoken";
import { AddPin, CreateUserMobileApp, MobileLoginInput, OtpVerification } from "../../../api/Request/mobileAppUser";
import UserToken from "../../../app/model/user.token";
import { IMobileUserRepository } from "../../../domain/mobile-app/user.domain";
import { CartModel } from "../../../app/model/cart";
import mailService from "../../../utils/common/mail.service";
import { ChangePasswordInput } from "../../../api/Request/user";
import { RootModel } from "../../../app/model/root";
import AdminUsers from "../../../app/model/admin.user";
class MobileUserRepository implements IMobileUserRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }
  async loginUser(
    data: MobileLoginInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      // Step 1: Check if user exists
      const adminExist: any = await Users.findOne({
        phone: data.phone,
        isActive: 1,
        isDelete: 0,
      });

      if (!adminExist) {
        return createErrorResponse("User doesn't exist", 400);
      }

      // Step 2: Verify password
      const validPin = await bcrypt.compare(data.pin, adminExist?.pin);
      if (!validPin) {
        return createErrorResponse("Incorrect pin", 400);
      }

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
          id: adminExist._id, phone: adminExist.phone
        },
        _config.JwtSecretKey,
        { expiresIn: '7d' }
      );

      // Step 5: Save or update token
      const existingToken = await UserToken.findOne({ userId: adminExist._id });
      if (existingToken) {
        existingToken.token = token;
        await existingToken.save();
      } else {
        await UserToken.create({ userId: adminExist._id, token });
      }
      if (adminExist) {
        const guestCartData = await CartModel.findOne({ guestUserId: data.guestUserId, isActive: true, isDelete: false });

        if (guestCartData?.products?.length) {
          await CartModel.updateOne(
            { userId: adminExist._id },
            {
              $push: {
                products: { $each: guestCartData.products }
              }
            }
          );
        }

      }
      // Step 6: Build and return response
      const user: any = {
        _id: adminExist._id,
        name: adminExist.name,
        email: adminExist.email,
        isActive: adminExist.isActive,
        isDelete: adminExist.isDelete,
        phone: adminExist.phone ?? ''
      };

      return successResponse("Login ", StatusCodes.OK, { user, token });

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
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userDtl = await Users.findOne({
        phone: email,
        isActive: true,
        isDelete: 0
      })
      if (!userDtl) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found in the database."
        );
      }

      if (!userDtl.isVerfied) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Registration successful — please verify your account to proceed."
        );
      }

      // Map MongoDB document to User type
      const user: any = {
        name: userDtl.name,
        email: userDtl?.email,
        isActive: userDtl.isActive,
        isDelete: userDtl.isDelete,
        phone: userDtl.phone
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
  async otpVerification(
    data: OtpVerification
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {

      const userData = await Users.findOne({
        phone: data.phone
      });
      if (!userData) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found in the database."
        );
      }
      if (!data.otp) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Otp is required"
        );
      }
      if (userData?.otp !== data?.otp) {
        return createErrorResponse(
          "Invalid OTP",
          StatusCodes.BAD_REQUEST,
          "Invalid OTP"
        );
      }
      const user = await Users.findByIdAndUpdate({
        _id: userData._id
      },
        {
          $set: {
            isVerfied: true
          }
        }, { new: true });

      if (!user) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found in the database."
        );
      }
      if (!_config?.JwtSecretKey) {
        return createErrorResponse(
          "Server configuration error: Secret key is missing",
          500
        );
      }
      const token = jwt.sign(
        { id: user._id, phone: user.phone },
        _config?.JwtSecretKey,
        { expiresIn: _config.TokenDuration }
      );
      const existing = await UserToken.findOne({ userId: user._id });
      if (existing) {
        existing.token = token;
        await existing.save();
      } else {
        await UserToken.create({ userId: user._id, token });
      }
      return successResponse("Success", StatusCodes.OK, { user, token });
    } catch (error: any) {
      return createErrorResponse(
        "An unexpected error occurred",
        500,
        error.message || "Unknown error"
      );
    }
  }

  // Password management
  async createUser(
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userData = await Users.findOne({ phone: data.phone, isActive: 1, isDelete: 0 });

      if (userData) {
        return createErrorResponse(
          "User is already exist!!",
          StatusCodes.BAD_REQUEST,
          "User is already exist!!"
        );
      }

      const user = await Users.create({
        name: data.name,
        email: data.email,
        phone: data.phone
      });
      if (user) {
        await CartModel.updateOne({ guestUserId: data.guestUserId }, { userId: user._id })
      }
      return successResponse("User created successfully", StatusCodes.OK, { user });
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }
  async addPin(
    data: AddPin
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {

      const userData = await Users.findOne({
        phone: data.phone
      });
      if (!userData) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found in the database."
        );
      }
      const hasPass = await bcrypt.hash(data?.pin, 10);
      const user = await Users.findByIdAndUpdate({
        _id: userData._id
      },
        {
          $set: {
            pin: hasPass
          }
        }, { new: true });

      if (!user) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "No user with the given email found"
        );
      }
      if (!_config?.JwtSecretKey) {
        return createErrorResponse(
          "Server configuration error: Secret key is missing",
          500
        );
      }
      const token = jwt.sign(
        { id: user._id, phone: user.phone },
        _config?.JwtSecretKey,
        { expiresIn: '7d' }
      );
      const existing = await UserToken.findOne({ userId: user._id });
      if (existing) {
        existing.token = token;
        await existing.save();
      } else {
        await UserToken.create({ userId: user._id, token });
      }
      return successResponse("Success", StatusCodes.OK, { user, token });
    } catch (error: any) {
      return createErrorResponse(
        "An unexpected error occurred",
        500,
        error.message || "Unknown error"
      );
    }
  }
  async changePassword(
    id: string,
    data: ChangePasswordInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const admin: any = await Users.findById(id);
      if (!admin) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "User not found"
        );
      }
      const match = await bcrypt.compare(data.oldPin, admin?.pin);
      if (!match) {
        return createErrorResponse(
          "Old pin is incorrect",
          StatusCodes.BAD_REQUEST,
          "Old password incorrect"
        );
      }
      // Check if oldPin and newPin are the same (plain text)
      if (data.oldPin === data.newPin) {
        return createErrorResponse(
          "error",
          StatusCodes.BAD_REQUEST,
          "Old and new PIN are the same. Please try a different PIN."
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
  async updateUser(id: string,
    data: CreateUserMobileApp
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userData = await Users.findOne({ _id: new Types.ObjectId(id), isActive: 1, isDelete: 0 });

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
        lastName: data.lastName,
        pincode: data.pincode
      });
      if (user) {
        await CartModel.updateOne({ guestUserId: data.guestUserId }, { userId: userData._id })
      }
      return successResponse("User updated successfully", StatusCodes.OK, { user });
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }
  async userData(id: string,
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const userData = await Users.findOne({ _id: new Types.ObjectId(id), isActive: 1, isDelete: 0 });

      if (!userData) {
        return createErrorResponse(
          "User not found",
          StatusCodes.BAD_REQUEST,
          "User not found"
        );
      }


      return successResponse("User got successfully", StatusCodes.OK, userData);
    } catch (err: any) {
      return createErrorResponse(
        "error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
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

export function newMobileUserRepository(db: any): IMobileUserRepository {
  return new MobileUserRepository(db);
}
