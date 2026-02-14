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
import { AddPin, CreateUserMobileApp, ForgetPasswordRequest, MobileLoginInput, OtpVerification, ResetPasswordV2, VerifyForgetPasswordOtp } from "../../../api/Request/mobileAppUser";
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
      let adminExist: any;

      if (data.email && data.password) {
        // Step 1: Check if user exists by email
        adminExist = await Users.findOne({
          email: data.email,
          isActive: 1,
          isDelete: 0,
        });

        if (!adminExist) {
          return createErrorResponse("User doesn't exist", 400);
        }

        // Step 2: Verify password
        const validPassword = await bcrypt.compare(data.password as string, adminExist?.password || '');
        if (!validPassword) {
          return createErrorResponse("Incorrect password", 400);
        }
      } else if (data.phone && data.pin) {
        // Step 1: Check if user exists by phone
        adminExist = await Users.findOne({
          phone: data.phone,
          isActive: 1,
          isDelete: 0,
        });

        if (!adminExist) {
          return createErrorResponse("User doesn't exist", 400);
        }

        // Step 2: Verify pin
        const validPin = await bcrypt.compare(data.pin as string, adminExist?.pin || '');
        if (!validPin) {
          return createErrorResponse("Incorrect pin", 400);
        }
      } else {
        return createErrorResponse("Invalid login data. Provide email/password or phone/pin.", 400);
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
        await this.mergeGuestCart(data.guestUserId, adminExist._id);
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
      const phone = data.mobileNumber || data.phone || '';
      const userData = await Users.findOne({ phone: phone, isActive: 1, isDelete: 0 });

      if (userData) {
        return createErrorResponse(
          "User is already exist!!",
          StatusCodes.BAD_REQUEST,
          "User is already exist!!"
        );
      }

      const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

      const user = await Users.create({
        name: data.userName || data.name,
        userName: data.userName,
        email: data.email,
        phone: phone,
        password: hashedPassword,
        country: data.country,
        preferredLanguage: data.preferredLanguage
      });
      if (user) {
        await this.mergeGuestCart(data.guestUserId, user._id);
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
        await this.mergeGuestCart(data.guestUserId, userData._id);
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

  async requestForgetPasswordOtp(data: ForgetPasswordRequest): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const user = await Users.findOne({ email: data.email, isActive: 1, isDelete: 0 });
      if (!user) {
        return createErrorResponse("User not found with this email", StatusCodes.BAD_REQUEST);
      }

      // Generate 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      // Save OTP to user document
      await Users.updateOne({ _id: user._id }, { $set: { otp: otp } });

      // Send OTP via email
      console.log('Attempting to send OTP email to:', data.email);
      const emailSent = await mailService.commonMailSend(
        "Otp Verify",
        data.email,
        "Forget Password OTP",
        { otp: otp, name: user.name }
      );

      console.log('Email send result:', emailSent);

      if (!emailSent) {
        console.error('Failed to send OTP email. Check SMTP configuration.');
        return createErrorResponse("Failed to send OTP email. Please check your email configuration.", StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return successResponse("OTP sent successfully to your email", StatusCodes.OK, null);
    } catch (error: any) {
      return createErrorResponse("An unexpected error occurred", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async verifyForgetPasswordOtp(data: VerifyForgetPasswordOtp): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const user = await Users.findOne({ email: data.email, isActive: 1, isDelete: 0 });
      if (!user) {
        return createErrorResponse("User not found", StatusCodes.BAD_REQUEST);
      }

      if (user.otp !== data.otp) {
        return createErrorResponse("Invalid OTP", StatusCodes.BAD_REQUEST);
      }

      return successResponse("OTP verified successfully", StatusCodes.OK, null);
    } catch (error: any) {
      return createErrorResponse("An unexpected error occurred", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async resetPasswordV2(data: ResetPasswordV2): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const user = await Users.findOne({ email: data.email, isActive: 1, isDelete: 0 });
      if (!user) {
        return createErrorResponse("User not found", StatusCodes.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      await Users.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

      return successResponse("Password updated successfully", StatusCodes.OK, null);
    } catch (error: any) {
      return createErrorResponse("An unexpected error occurred", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  private async mergeGuestCart(guestUserId: string | undefined, userId: Types.ObjectId) {
    if (!guestUserId) return;

    try {
      const guestCart = await CartModel.findOne({ guestUserId, isActive: true, isDelete: false });
      if (!guestCart || !guestCart.products || guestCart.products.length === 0) return;

      const userCart = await CartModel.findOne({ userId, isActive: true, isDelete: false });

      if (!userCart) {
        // If no user cart, simply move the guest cart to the user
        await CartModel.updateOne(
          { _id: guestCart._id },
          {
            $set: {
              userId: userId,
              guestUserId: null
            }
          }
        );
      } else {
        // Merge products from guest cart into user cart
        const guestProducts = guestCart.products;
        const userProducts = [...userCart.products];

        for (const gp of guestProducts) {
          const existingIdx = userProducts.findIndex((up: any) =>
            up.productId.toString() === gp.productId.toString() &&
            this.areAttributesEqual(up.attributes, gp.attributes) &&
            up.offerId?.toString() === gp.offerId?.toString()
          );

          if (existingIdx > -1) {
            userProducts[existingIdx].quantity += gp.quantity;
          } else {
            userProducts.push(gp);
          }
        }

        // Recalculate totals
        const uniqueOffers = new Set();
        let subtotal = 0;

        userProducts.forEach((product: any) => {
          if (product.offerId) {
            const offerId = product.offerId.toString();
            if (!uniqueOffers.has(offerId)) {
              uniqueOffers.add(offerId);
              // Use the stored price/mrpPrice for the offer
              subtotal += (product.mrpPrice || product.price || 0) * (product.quantity || 1);
            }
          } else {
            subtotal += (product.mrpPrice || product.price || 0) * (product.quantity || 1);
          }
        });

        await CartModel.updateOne(
          { _id: userCart._id },
          {
            $set: {
              products: userProducts,
              subtotal: subtotal,
              total: subtotal
            }
          }
        );

        // Mark guest cart as merged (delete it)
        await CartModel.updateOne({ _id: guestCart._id }, { $set: { isDelete: true, isActive: false } });
      }
    } catch (error) {
      console.error("Error merging guest cart:", error);
    }
  }

  // Helper method for attribute comparison
  private areAttributesEqual(attr1: any, attr2: any): boolean {
    const normalize = (attr: any) => {
      if (!attr) return {};
      // Ensure consistent structure for comparison by sorting keys and converting values to strings
      return Object.keys(attr).sort().reduce((acc: any, key) => {
        const value = attr[key];
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {});
    };

    const n1 = normalize(attr1);
    const n2 = normalize(attr2);

    return JSON.stringify(n1) === JSON.stringify(n2);
  }
}

export function newMobileUserRepository(db: any): IMobileUserRepository {
  return new MobileUserRepository(db);
}
