import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import bcrypt from "bcrypt";
import { _config } from "../../../config/config";
import jwt from "jsonwebtoken";
import UserToken from "../../../app/model/user.token";
// import { IMobileUserRepository } from "../../../domain/mobile-app/user.domain";
import { OtpVerification, MobileLoginInput, CreateWholesaler, StatusUpdate, CreditUpdate, ChangePasswordAfterVerificationInput } from "../../../api/Request/wholesalerRequest";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import Pagination from "../../../api/response/paginationResponse";
import { UploadedFile } from "express-fileupload";
import { Uploads } from "../../../utils/uploads/image.upload";
import mailService from "../../../utils/common/mail.service";
import { ChangePasswordInput } from "../../../api/Request/user";
import { WholeSalerCreditModel } from "../../../app/model/wholesaler.credit";
import { RootModel } from "../../../app/model/root";
import { logAdminUserActivity } from "../../../app/model/mobile.otp";
import AdminUsers from "../../../app/model/admin.user";
import { IWholesalerRepository } from "../../../domain/admin/wholsalerDomain";
class WholesalerRepository implements IWholesalerRepository {
    private db: any;

    constructor(db: any) {
        this.db = db;
    }
    async updateCreditForWholeSalerRetailer(input: CreditUpdate, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            const creditExits = await WholeSalerCreditModel.findOne({ wholeSalerId: new Types.ObjectId(input.id), isActive: true, isDelete: false });

            if (!creditExits) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "Credit not found"
                );
            }

            const credit = {
                creditLimit: input.creditLimit,
                creditPeriod: creditExits.creditPeriod,
                reason: input.reason,
                docProof: creditExits.documentProof,
                wholeSalerId: new Types.ObjectId(input.id),
                paymentTerm: creditExits.paymentTerm,
                paymentPreferMode: creditExits.paymentPreferMode,
                modifiedBy: new Types.ObjectId(userId)
            };

            await WholeSalerCreditModel.updateOne(
                {
                    wholeSalerId: new Types.ObjectId(input.id),
                    isActive: true,
                    isDelete: false
                },
                {
                    $set: {
                        ...credit
                    }
                }
            );
            return successResponse("Success", StatusCodes.OK, { message: "Credit limit updated successfully" });

        } catch (err: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                err.message || "Unknown error"
            );
        }
    }
    async findUserByEmail(email: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {

            const user = await WholesalerRetailsers.findOne({ phone: email, isActive: true, isDelete: false });

            if (!user) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "User not found"
                );
            }
            return successResponse("Success", StatusCodes.OK, user);

        } catch (err: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                err.message || "Unknown error"
            );
        }
    }
    // async otpVerification(
    //     data: OtpVerification
    // ): Promise<ApiResponse<any> | ErrorResponse> {
    //     try {

    //         const userData = await WholesalerRetailsers.findOne({
    //             phone: data.phone
    //         });
    //         if (!userData) {
    //             return createErrorResponse(
    //                 "error",
    //                 StatusCodes.BAD_REQUEST,
    //                 "No user with the given email found in the database."
    //             );
    //         }
    //         if (!data.otp) {
    //             return createErrorResponse(
    //                 "error",
    //                 StatusCodes.BAD_REQUEST,
    //                 "Otp is required"
    //             );
    //         }
    //         if (userData?.otp !== data?.otp) {
    //             return createErrorResponse(
    //                 "Invalid OTP",
    //                 StatusCodes.BAD_REQUEST,
    //                 "Invalid OTP"
    //             );
    //         }
    //         const user = await WholesalerRetailsers.findByIdAndUpdate({
    //             _id: userData._id
    //         },
    //             {
    //                 $set: {
    //                     isVerfied: true,
    //                     otp: ''
    //                 }
    //             }, { new: true });

    //         if (!user) {
    //             return createErrorResponse(
    //                 "error",
    //                 StatusCodes.BAD_REQUEST,
    //                 "No user with the given email found in the database."
    //             );
    //         }
    //         if (!_config?.JwtSecretKey) {
    //             return createErrorResponse(
    //                 "Server configuration error: Secret key is missing",
    //                 500
    //             );
    //         }

    //         return successResponse("Success", StatusCodes.OK, user);
    //     } catch (error: any) {
    //         return createErrorResponse(
    //             "An unexpected error occurred",
    //             500,
    //             error.message || "Unknown error"
    //         );
    //     }
    // }
    // In your WholesalerRepository class
    async otpVerification(
        data: OtpVerification
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Find user by phone number
            const userData = await WholesalerRetailsers.findOne({
                phone: data.phone
            });

            if (!userData) {
                return createErrorResponse(
                    "No user with the given phone number found",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }

            // Check if OTP is provided
            if (!data.otp) {
                return createErrorResponse(
                    "OTP is required",
                    StatusCodes.BAD_REQUEST,
                    "Otp is required"
                );
            }

            // Static OTP verification - only accept "1234"
            if (data.otp !== "1234") {
                return createErrorResponse(
                    "Invalid OTP",
                    StatusCodes.BAD_REQUEST,
                    "Invalid OTP"
                );
            }

            // Update user verification status and clear OTP
            const user = await WholesalerRetailsers.findByIdAndUpdate(
                { _id: userData._id },
                {
                    $set: {
                        isVerfied: true,
                        otp: ''
                    }
                },
                { new: true }
            );

            if (!user) {
                return createErrorResponse(
                    "User update failed",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }

            // Generate JWT token
            if (!_config?.JwtSecretKey) {
                return createErrorResponse(
                    "Server configuration error: Secret key is missing",
                    500
                );
            }

            const token = jwt.sign(
                {
                    id: user._id,
                    phone: user.phone
                },
                _config.JwtSecretKey,
                { expiresIn: '7d' }
            );

            // Save or update token
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

            // Return only userId, token, and message
            return {
                statusCode: StatusCodes.OK,
                status: "success",
                message: "OTP verified successfully",
                data: {
                    userId: user._id.toString(),
                    token: token
                }
            };

        } catch (error: any) {
            return createErrorResponse(
                "An unexpected error occurred",
                500,
                error.message || "Unknown error"
            );
        }
    }
    async updateStatus(data: StatusUpdate): Promise<ApiResponse<any> | ErrorResponse> {
        try {

            const userData: any = await WholesalerRetailsers.findOne({
                phone: data.phone
            });
            if (!userData) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }
            if (!data?.pin) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "Pin is Required"
                );
            }
            // Dynamic Pin generate
            // const pin: any = Math.floor(1000 + Math.random() * 9000);
            const encryptedPin = data?.status == 'approved' ? await bcrypt.hash(data?.pin, 10) : '';
            const user = await WholesalerRetailsers.findByIdAndUpdate({
                _id: userData._id
            },
                {
                    $set: {
                        status: data.status ?? userData.status,
                        pin: encryptedPin
                    }
                }, { new: true });
            if (!user) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }
            // send mail to user
            mailService.commonMailSend("UpdatePin", userData?.email, "Your Login PIN Has Been Updated", { name: userData?.name, pin: data.pin });

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
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const userData = await WholesalerRetailsers.findOne({ phone: data.phone, isActive: 1, isDelete: 0 });

            if (userData) {
                if (userData.status == 'pending') {
                    return createErrorResponse(
                        "You are a registered user, but your account still requires admin approval.",
                        StatusCodes.BAD_REQUEST,
                        "You are a registered user, but your account still requires admin approval."
                    );
                }

                return createErrorResponse(
                    "User is already exist!!",
                    StatusCodes.BAD_REQUEST,
                    "User is already exist!!"
                );
            }
            const imageArr = [];
            if (data?.shopImage as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    data?.shopImage,
                    "wholesaler-retailers/shop-image",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }
            data.shopImage = imageArr;

            const input = {
                name: data.companyName.toUpperCase(),
                email: data.email,
                phone: data.phone,
                customerType: data.customerType,
                companyName: data.companyName.toUpperCase(),
                discount: data.discount,
                contactPersonName: data.contactPersonName,
                designation: data.designation,
                mobileNumber: data.mobileNumber,
                address: data.address,
                // location: data.location,
                gstNumber: data.gstNumber,
                otp: data.otp,
                Id: data.Id,
                guestUserId: data.guestUserId,
                createdBy: new Types.ObjectId(data.createdBy),
                shopType: new Types.ObjectId(data.shopType),
                location: data.location,
                shopImage: imageArr
            }

            const user = await WholesalerRetailsers.create(input);


            const credit = {
                creditLimit: data.creditLimit.toString(),
                creditPeriod: data.creditPeriod.toString(),
                docProof: imageArr,
                wholeSalerId: user._id,
                paymentTerm: data.paymentTerm,
                paymentPreferMode: data.preferredPaymentMode,
                createdBy: new Types.ObjectId(data.createdBy)
            };


            await WholeSalerCreditModel.create(credit)

            // insert wholesaler visit tracker
            // await WholesalerVisitModel.insertOne({
            //     wholeSalerId: user._id, // Must be ObjectId
            //     visitPurpose: "New Visit", // Should match allowed values if enum exists
            //     followUpDate: null, // Can be null or Date
            //     visitNotes: '', // Optional or empty string
            //     status: 'Completed', // Should also match allowed values
            //     createdBy: new ObjectId(input.createdBy), // Ensure input.createdBy is a valid ID
            //     modifiedBy: new ObjectId(input.createdBy)
            // });

            return successResponse("User created successfully", StatusCodes.OK, user);
        } catch (err: any) {
            return createErrorResponse(
                "error",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async updateUser(id: string,
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const userData = await WholesalerRetailsers.findOne({ _id: new Types.ObjectId(id), isDelete: 0 });

            if (!userData) {
                return createErrorResponse(
                    "User not found",
                    StatusCodes.BAD_REQUEST,
                    "User not found"
                );
            }
            const imageArr = [];
            if (data?.shopImage as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    data?.shopImage,
                    "wholesaler-retailers/shop-image",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }
            data.shopImage = imageArr;


            const findCredit = await WholeSalerCreditModel.findOne({
                wholeSalerId: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            })

            // if (!findCredit) {
            //     return createErrorResponse(
            //         "User credit not found",
            //         StatusCodes.BAD_REQUEST,
            //         "User credit not found"
            //     );
            // }
            if (findCredit) {
                const imageArr = [];

                if (data?.docProof as unknown as UploadedFile) {
                    const image = await Uploads.processFiles(
                        data?.docProof,
                        "wholesaler-retailers/documents",
                        "doc",
                        findCredit.documentProof[0].docName ?? ''
                    );
                    imageArr.push(...image);
                }

                const isCreditDetailsChanged = await WholeSalerCreditModel.countDocuments({
                    wholeSalerId: new Types.ObjectId(id),
                    isActive: true,
                    isDelete: false,
                    creditLimit: data.creditLimit.toString(),
                    creditPeriod: data.creditPeriod.toString(),
                    paymentTerm: data.paymentTerm,
                    paymentPreferMode: data.preferredPaymentMode,
                    documentProof: imageArr
                })

                if (isCreditDetailsChanged == 0) {
                    await WholeSalerCreditModel.updateMany({
                        wholeSalerId: new Types.ObjectId(id),
                    }, {
                        $set: {
                            isActive: false,
                        }
                    })

                    const credit = {
                        wholeSalerId: new Types.ObjectId(id),
                        creditLimit: data.creditLimit,
                        creditPeriod: data.creditPeriod,
                        paymentTerm: data.paymentTerm,
                        paymentPreferMode: data.preferredPaymentMode,
                        documentProof: imageArr,
                        modifiedBy: new Types.ObjectId(data.modifiedBy)
                    }

                    await WholeSalerCreditModel.create(credit)
                }
            }


            const input = {
                name: data.companyName.toUpperCase(),
                email: data.email,
                phone: data.phone,
                customerType: data.customerType,
                companyName: data.companyName.toUpperCase(),
                discount: data.discount,
                contactPersonName: data.contactPersonName,
                designation: data.designation,
                mobileNumber: data.mobileNumber,
                address: data.address,
                location: data.location,
                gstNumber: data.gstNumber,
                otp: data.otp,
                Id: data.Id,
                guestUserId: data.guestUserId,
                modifiedBy: new Types.ObjectId(data.modifiedBy),
                shopType: new Types.ObjectId(data.shopType),
                shopImage: imageArr,
                isActive: data.isActive
            }

            const user = await WholesalerRetailsers.findByIdAndUpdate(id, input);

            if (!user) {
                return createErrorResponse(
                    "Unable to update user",
                    StatusCodes.BAD_REQUEST,
                    "Unable to update user",
                );
            }
            return successResponse("User updated successfully", StatusCodes.OK, user);
        } catch (err: any) {
            return createErrorResponse(
                "error",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async loginUser(
        data: MobileLoginInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Step 1: Check if user exists
            const adminExist: any = await WholesalerRetailsers.findOne({
                phone: data.phone,
                isActive: 1,
                isDelete: 0,
            });

            if (!adminExist) {
                return createErrorResponse("User doesn't exist", 400);
            }

            // if (!adminExist?.pin) {
            //     return createErrorResponse("Please set your PIN to proceed.", 400);
            // }

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

            // Step 6: Build and return response
            const user: any = {
                _id: adminExist._id,
                name: adminExist.name,
                email: adminExist.email,
                phone: adminExist.phone,
                customerType: adminExist.customerType,
                isActive: adminExist.isActive,
                isDelete: adminExist.isDelete,
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
    async getAllApproved(params: {
        limit?: number;
        page?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        userId?: string;
        type?: string;
        from?: string;
    }): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const {
                limit,
                page,
                search,
                sortBy,
                order,
                type,
                from,
                userId
            } = params;

            const resolvedLimit = Number(limit) ?? 100;
            const resolvedPage = Number(page) ?? 0;
            const resolvedSortBy = sortBy || 'createdAt';
            const resolvedOrder = order === 'asc' ? 1 : -1;
            const skip = Math.max(resolvedPage * resolvedLimit, 0);

            const match: any = {};
            match.isActive = true;
            match.isDelete = false;
            match.status = 'approved';

            if (from === 'mobile-app') {
                const route = await RootModel.findOne({
                    salesman: new Types.ObjectId(userId),
                    isDelete: false,
                    isActive: true,
                }, { pincode: 1 });

                const pincodes = route?.pincode.map((p) => p.code) ?? [];
                match['address.postalCode'] = { $in: pincodes }
            }

            if (type) match.customerType = type;

            if (search) {
                const regex = { $regex: search, $options: 'i' };
                match.$or = [
                    { name: regex },
                    { phone: regex },
                    { mobileNumber: regex },
                    { email: regex },
                    { companyName: regex },
                    { shopType: regex }
                ];
            }

            const basePipeline: any[] = [];

            if (Object.keys(match).length > 0) {
                basePipeline.push({ $match: match });
            }

            basePipeline.push(
                {
                    $lookup: {
                        from: 'orders',
                        let: { userId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$placedBy', '$$userId'] } } },
                            {
                                $group: {
                                    _id: null,
                                    totalOrders: { $sum: 1 },
                                    totalAmount: { $sum: '$totalAmount' },
                                    lastPurchased: { $max: '$createdAt' },
                                    pendingPayments: {
                                        $sum: {
                                            $cond: [
                                                { $in: ['$paymentStatus', ['pending', 'partially-paid']] },
                                                1,
                                                0
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'orderStats'
                    }
                },
                {
                    $addFields: {
                        totalOrders: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalOrders', 0] }, 0] },
                        totalAmount: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalAmount', 0] }, 0] },
                        lastPurchased: { $ifNull: [{ $arrayElemAt: ['$orderStats.lastPurchased', 0] }, null] },
                        pendingPayments: { $ifNull: [{ $arrayElemAt: ['$orderStats.pendingPayments', 0] }, 0] }
                    }
                },
                {
                    $lookup: {
                        from: 'wholesalercredits',
                        localField: '_id',
                        foreignField: 'wholeSalerId',
                        as: 'credits'
                    }
                },
                {
                    $addFields: {
                        activeCredits: {
                            $filter: {
                                input: "$credits",
                                as: "credit",
                                cond: { $eq: ["$$credit.isActive", true] }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'customervariants',
                        localField: 'customerVariant',
                        foreignField: '_id',
                        as: 'customervariants'
                    }
                },
                {
                    $lookup: {
                        from: 'shoptypes',
                        localField: 'shopType',
                        foreignField: '_id',
                        as: 'shoptypes'
                    }
                },
                {
                    $project: {
                        Id: 1,
                        status: 1,
                        name: 1,
                        phone: 1,
                        mobileNumber: 1,
                        customerType: 1,
                        totalOrders: 1,
                        totalAmount: 1,
                        lastPurchased: 1,
                        pendingPayments: 1,
                        email: 1,
                        isDelete: 1,
                        isActive: 1,
                        isVerfied: 1,
                        companyName: 1,
                        discount: 1,
                        contactPersonName: 1,
                        designation: 1,
                        address: 1,
                        location: 1,
                        gstNumber: 1,
                        activeCredits: 1,
                        creditLimit: { $ifNull: [{ $arrayElemAt: ['$activeCredits.creditLimit', 0] }, ''] },
                        creditPeriod: { $ifNull: [{ $arrayElemAt: ['$activeCredits.creditPeriod', 0] }, ''] },
                        createdAt: 1,
                        updatedAt: 1,
                        customerVariant: 1,
                        customerVariantName: {
                            $ifNull: [{ $arrayElemAt: ['$customervariants.name', 0] }, '']
                        },
                        shopTypeName: {
                            $ifNull: [{ $arrayElemAt: ['$shoptypes.name', 0] }, '']
                        },
                        shopType: 1
                    }
                }
            );
            const countPipeline = [...basePipeline, { $count: 'total' }];
            const dataPipeline = [
                ...basePipeline,
                { $sort: { [resolvedSortBy]: resolvedOrder } },
                { $skip: skip },
                { $limit: resolvedLimit }
            ];

            const [countResult, dataResult] = await Promise.all([
                WholesalerRetailsers.aggregate(countPipeline),
                WholesalerRetailsers.aggregate(dataPipeline)
            ]);

            return Pagination(
                countResult?.[0]?.total || 0,
                dataResult,
                resolvedLimit,
                skip
            );

        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving wholesalers',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getAll(params: {
        limit?: number;
        page?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        userId?: string;
        type?: string;
        from?: string;
    }): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const {
                limit,
                page,
                search,
                sortBy,
                order,
                type,
                from,
                userId
            } = params;

            const resolvedLimit = Number(limit) ?? 10000;
            const resolvedPage = Number(page) ?? 0;
            const resolvedSortBy: any = sortBy || { createdAt: -1 };
            const resolvedOrder = order === 'asc' ? 1 : -1;
            const skip = Math.max(resolvedPage * resolvedLimit, 0);

            const match: any = {};
            match.isActive = true;
            match.isDelete = false;

            if (from === 'mobile-app') {
                const route = await RootModel.findOne({
                    salesman: new Types.ObjectId(userId),
                    isDelete: false,
                    isActive: true,
                }, { pincode: 1 });

                const user = await AdminUsers.findOne({ _id: new Types.ObjectId(userId) });
                if (user?.salesWithCollection === false) {
                    const pincodes = route?.pincode.map((p) => p.code) ?? [];
                    match['address.postalCode'] = { $in: pincodes }
                }
            }

            if (type) match.customerType = type;

            if (search) {
                const regex = { $regex: search, $options: 'i' };
                match.$or = [
                    { name: regex },
                    { phone: regex },
                    { mobileNumber: regex },
                    { email: regex },
                    { companyName: regex },
                    { shopType: regex }
                ];
            }

            const basePipeline: any[] = [];

            if (Object.keys(match).length > 0) {
                basePipeline.push({ $match: match });
            }

            basePipeline.push(
                {
                    $lookup: {
                        from: 'orders',
                        let: { userId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$placedBy", "$$userId"] },
                                            { $ne: ["$status", "cancelled"] },
                                            { $ne: ["$status", "reorder"] }
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalOrders: { $sum: 1 },
                                    totalAmount: { $sum: '$totalAmount' },
                                    lastPurchased: { $max: '$createdAt' },
                                    pendingPayments: {
                                        $sum: {
                                            $cond: [
                                                { $in: ["$paymentStatus", ["pending", "partially-paid"]] },
                                                "$totalAmount",
                                                0
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'orderStats'
                    }
                },
                // Credit details lookup - IMPROVED: Include return order matching per order
                {
                    $lookup: {
                        from: "wholesalercredits",
                        let: { wholesalerId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$wholeSalerId", "$$wholesalerId"] },
                                            { $eq: ["$isActive", true] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "wholesalercreditsDtls"
                    }
                },
                // IMPROVED: Get credit orders with their respective return amounts
                {
                    $lookup: {
                        from: "orders",
                        let: { wholesalerId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$placedBy", "$$wholesalerId"] },
                                            { $eq: ["$paymentMode", "CREDIT"] },
                                            { $in: ["$paymentStatus", ["pending", "partially-paid"]] }
                                        ]
                                    }
                                }
                            },
                            // Lookup return orders for each individual order
                            {
                                $lookup: {
                                    from: "returnorders",
                                    let: { orderId: "$_id" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$orderId", "$$orderId"] },
                                                        { $eq: ["$status", "Received at Warehouse"] },
                                                        { $eq: ["$isActive", true] },
                                                        { $eq: ["$isDelete", false] }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $group: {
                                                _id: null,
                                                totalReturnAmount: { $sum: "$totalAmount" }
                                            }
                                        }
                                    ],
                                    as: "orderReturns"
                                }
                            },
                            {
                                $addFields: {
                                    orderReturnAmount: { $ifNull: [{ $arrayElemAt: ["$orderReturns.totalReturnAmount", 0] }, 0] },
                                    // Calculate adjusted amount for this specific order
                                    adjustedAmount: {
                                        $max: [
                                            0,
                                            { $subtract: ["$totalAmount", { $ifNull: [{ $arrayElemAt: ["$orderReturns.totalReturnAmount", 0] }, 0] }] }
                                        ]
                                    },
                                    adjustedPendingAmount: {
                                        $max: [
                                            0,
                                            {
                                                $subtract: [
                                                    { $subtract: ["$totalAmount", { $ifNull: [{ $arrayElemAt: ["$orderReturns.totalReturnAmount", 0] }, 0] }] },
                                                    "$amountPaid"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "creditOrders"
                    }
                },
                {
                    $lookup: {
                        from: "orders",
                        let: { wholesalerId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$placedBy", "$$wholesalerId"] },
                                            { $eq: ["$paymentMode", "CREDIT"] },
                                            { $eq: ["$paymentStatus", "paid"] }
                                        ]
                                    }
                                }
                            },
                            {
                                $sort: { updatedAt: -1 }
                            },
                            {
                                $limit: 1
                            }
                        ],
                        as: "lastPaidOrder"
                    }
                },
                // Lookup from admins collection for createdBy user
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'adminCreatedBy'
                    }
                },
                // Lookup from adminusers collection for createdBy user
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'adminUserCreatedBy'
                    }
                },
                // Lookup from adminusers collection to get role information
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdByAdminUser'
                    }
                },
                // Lookup from userroles collection to get role name
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'createdByAdminUser.roleId',
                        foreignField: '_id',
                        as: 'createdByUserRole'
                    }
                },
                {
                    $lookup: {
                        from: 'wholesalercredits',
                        localField: '_id',
                        foreignField: 'wholeSalerId',
                        as: 'credits'
                    }
                },
                {
                    $addFields: {
                        activeCredits: {
                            $filter: {
                                input: "$credits",
                                as: "credit",
                                cond: { $eq: ["$$credit.isActive", true] }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'customervariants',
                        localField: 'customerVariant',
                        foreignField: '_id',
                        as: 'customervariants'
                    }
                },
                {
                    $lookup: {
                        from: 'shoptypes',
                        localField: 'shopType',
                        foreignField: '_id',
                        as: 'shoptypes'
                    }
                },
                {
                    $addFields: {
                        totalOrders: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalOrders', 0] }, 0] },
                        totalAmount: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalAmount', 0] }, 0] },
                        lastPurchased: { $ifNull: [{ $arrayElemAt: ['$orderStats.lastPurchased', 0] }, null] },
                        pendingPayments: { $ifNull: [{ $arrayElemAt: ['$orderStats.pendingPayments', 0] }, 0] },
                        // Combine results from both admin lookups for name
                        createdByUser: {
                            $cond: {
                                if: { $gt: [{ $size: '$adminCreatedBy' }, 0] },
                                then: { $arrayElemAt: ['$adminCreatedBy', 0] },
                                else: {
                                    $cond: {
                                        if: { $gt: [{ $size: '$adminUserCreatedBy' }, 0] },
                                        then: { $arrayElemAt: ['$adminUserCreatedBy', 0] },
                                        else: null
                                    }
                                }
                            }
                        },
                        // Get role information
                        createdByRole: {
                            $ifNull: [
                                { $arrayElemAt: ['$createdByUserRole', 0] },
                                null
                            ]
                        },
                        // Calculate credit details - Convert all values to numbers first
                        creditPeriodNum: {
                            $convert: {
                                input: { $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditPeriod", 0] }, 0] },
                                to: "int",
                                onError: 0,
                                onNull: 0
                            }
                        },
                        creditLimitNum: {
                            $convert: {
                                input: { $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditLimit", 0] }, 0] },
                                to: "double",
                                onError: 0,
                                onNull: 0
                            }
                        }
                    }
                },
                // CORRECTED: Calculate used credit amount per order with individual return deductions
                {
                    $addFields: {
                        // Calculate total used credit amount (sum of adjusted pending amounts for all credit orders)
                        usedCreditAmount: {
                            $reduce: {
                                input: "$creditOrders",
                                initialValue: 0,
                                in: {
                                    $add: [
                                        "$$value",
                                        "$$this.adjustedPendingAmount"
                                    ]
                                }
                            }
                        },
                        // Calculate total paid amount across all credit orders
                        paidAmount: {
                            $reduce: {
                                input: "$creditOrders",
                                initialValue: 0,
                                in: { $add: ["$$value", { $ifNull: ["$$this.amountPaid", 0] }] }
                            }
                        },
                        lastPaymentDate: {
                            $ifNull: [{ $arrayElemAt: ["$lastPaidOrder.updatedAt", 0] }, ""]
                        },
                        // Calculate total return amount for reference
                        totalReceivedReturnAmount: {
                            $reduce: {
                                input: "$creditOrders",
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.orderReturnAmount"] }
                            }
                        }
                    }
                },
                // Add calculated fields for credit details
                {
                    $addFields: {
                        currentCreditDetails: {
                            creditPeriod: "$creditPeriodNum",
                            creditLimit: "$creditLimitNum",
                            lastPaymentDate: "$lastPaymentDate",
                            usedCreditAmount: "$usedCreditAmount",
                            paidAmount: "$paidAmount",
                            availableCreditAmount: {
                                $max: [
                                    0,
                                    { $subtract: ["$creditLimitNum", "$usedCreditAmount"] }
                                ]
                            },
                            remainingAmountToPay: {
                                $max: [
                                    0,
                                    { $subtract: ["$usedCreditAmount", "$paidAmount"] }
                                ]
                            },
                            totalReceivedReturnAmount: "$totalReceivedReturnAmount"
                        }
                    }
                },
                // First project stage to include all fields
                {
                    $project: {
                        // Include all document fields
                        document: "$$ROOT",
                        // Include computed fields
                        totalOrders: 1,
                        totalAmount: 1,
                        lastPurchased: 1,
                        pendingPayments: 1,
                        createdByUser: 1,
                        createdByRole: 1,
                        activeCredits: 1,
                        customervariants: 1,
                        shoptypes: 1,
                        currentCreditDetails: 1,
                        // Include credit orders for debugging
                        creditOrders: {
                            $map: {
                                input: "$creditOrders",
                                as: "order",
                                in: {
                                    orderCode: "$$order.orderCode",
                                    totalAmount: "$$order.totalAmount",
                                    amountPaid: "$$order.amountPaid",
                                    orderReturnAmount: "$$order.orderReturnAmount",
                                    adjustedAmount: "$$order.adjustedAmount",
                                    adjustedPendingAmount: "$$order.adjustedPendingAmount"
                                }
                            }
                        }
                    }
                },
                // Second project stage to shape the final response
                {
                    $project: {
                        // Include all original document fields
                        Id: "$document._id",
                        status: "$document.status",
                        name: "$document.name",
                        phone: "$document.phone",
                        mobileNumber: "$document.mobileNumber",
                        customerType: "$document.customerType",
                        email: "$document.email",
                        isDelete: "$document.isDelete",
                        isActive: "$document.isActive",
                        isVerfied: "$document.isVerfied",
                        companyName: "$document.companyName",
                        discount: "$document.discount",
                        contactPersonName: "$document.contactPersonName",
                        designation: "$document.designation",
                        address: "$document.address",
                        location: "$document.location",
                        gstNumber: "$document.gstNumber",
                        createdAt: "$document.createdAt",
                        updatedAt: "$document.updatedAt",
                        customerVariant: "$document.customerVariant",
                        shopType: "$document.shopType",
                        shopImage: "$document.shopImage",
                        createdBy: "$document.createdBy",

                        // Include computed fields
                        totalOrders: 1,
                        totalAmount: 1,
                        lastPurchased: 1,
                        pendingPayments: 1,

                        // Created by user information as object
                        createdByInfo: {
                            name: {
                                $cond: {
                                    if: { $ne: ['$createdByUser', null] },
                                    then: '$createdByUser.name',
                                    else: ''
                                }
                            },
                            email: {
                                $cond: {
                                    if: { $ne: ['$createdByUser', null] },
                                    then: '$createdByUser.email',
                                    else: ''
                                }
                            },
                            role: {
                                $cond: {
                                    if: { $ne: ['$createdByRole', null] },
                                    then: '$createdByRole.roleName',
                                    else: ''
                                }
                            },
                            roleId: {
                                $cond: {
                                    if: { $ne: ['$createdByRole', null] },
                                    then: '$createdByRole._id',
                                    else: null
                                }
                            }
                        },

                        creditLimit: { $ifNull: [{ $arrayElemAt: ['$activeCredits.creditLimit', 0] }, ''] },
                        creditPeriod: { $ifNull: [{ $arrayElemAt: ['$activeCredits.creditPeriod', 0] }, ''] },
                        customerVariantName: {
                            $ifNull: [{ $arrayElemAt: ['$customervariants.name', 0] }, '']
                        },
                        shopTypeName: {
                            $ifNull: [{ $arrayElemAt: ['$shoptypes.name', 0] }, '']
                        },

                        // Include the current credit details
                        currentCreditDetails: 1,

                        // Optional: Include credit orders breakdown for debugging
                        creditOrdersBreakdown: 1
                    }
                }
            );

            const countPipeline = [...basePipeline, { $count: 'total' }];
            const dataPipeline = [
                ...basePipeline,
                { $sort: { [resolvedSortBy]: resolvedOrder } },
                { $skip: skip },
                { $limit: resolvedLimit },
            ];

            const [countResult, dataResult] = await Promise.all([
                WholesalerRetailsers.aggregate(countPipeline),
                WholesalerRetailsers.aggregate(dataPipeline)
            ]);

            return Pagination(
                countResult?.[0]?.total || 0,
                dataResult,
                resolvedLimit,
                skip
            );

        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving wholesalers',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getAllWithInactive(params: {
        limit?: number;
        page?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        userId?: string;
        type?: string;
        from?: string;
    }): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const {
                limit,
                page,
                search,
                sortBy,
                order,
                type,
                from,
                userId
            } = params;

            const resolvedLimit = Number(limit) ?? 10000;
            const resolvedPage = Number(page) ?? 0;
            const resolvedSortBy: any = sortBy || { createdAt: -1 };
            const resolvedOrder = order === 'asc' ? 1 : -1;
            const skip = Math.max(resolvedPage * resolvedLimit, 0);

            const match: any = {};
            // match.isActive = true;
            match.isDelete = false;

            if (from === 'mobile-app') {
                const route = await RootModel.findOne({
                    salesman: new Types.ObjectId(userId),
                    isDelete: false,
                    isActive: true,
                }, { pincode: 1 });

                const user = await AdminUsers.findOne({ _id: new Types.ObjectId(userId) });
                if (user?.salesWithCollection === false) {
                    const pincodes = route?.pincode.map((p) => p.code) ?? [];
                    match['address.postalCode'] = { $in: pincodes }
                }
            }

            if (type) match.customerType = type;

            if (search) {
                const regex = { $regex: search, $options: 'i' };
                match.$or = [
                    { name: regex },
                    { phone: regex },
                    { mobileNumber: regex },
                    { email: regex },
                    { companyName: regex },
                    { shopType: regex }
                ];
            }

            const basePipeline: any[] = [];

            if (Object.keys(match).length > 0) {
                basePipeline.push({ $match: match });
            }

            basePipeline.push(
                // Lookup from admins collection for createdBy user
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'adminCreatedBy'
                    }
                },
                // Lookup from adminusers collection for createdBy user
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'adminUserCreatedBy'
                    }
                },
                // Lookup from adminusers collection to get role information
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdByAdminUser'
                    }
                },
                // Lookup from userroles collection to get role name
                {
                    $lookup: {
                        from: 'userroles',
                        localField: 'createdByAdminUser.roleId',
                        foreignField: '_id',
                        as: 'createdByUserRole'
                    }
                },
                {
                    $lookup: {
                        from: 'wholesalercredits',
                        localField: '_id',
                        foreignField: 'wholeSalerId',
                        as: 'credits'
                    }
                },
                {
                    $addFields: {
                        activeCredits: {
                            $filter: {
                                input: "$credits",
                                as: "credit",
                                cond: { $eq: ["$$credit.isActive", true] }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'customervariants',
                        localField: 'customerVariant',
                        foreignField: '_id',
                        as: 'customervariants'
                    }
                },
                {
                    $lookup: {
                        from: 'shoptypes',
                        localField: 'shopType',
                        foreignField: '_id',
                        as: 'shoptypes'
                    }
                },
                {
                    $addFields: {
                        createdByUser: {
                            $cond: {
                                if: { $gt: [{ $size: '$adminCreatedBy' }, 0] },
                                then: { $arrayElemAt: ['$adminCreatedBy', 0] },
                                else: {
                                    $cond: {
                                        if: { $gt: [{ $size: '$adminUserCreatedBy' }, 0] },
                                        then: { $arrayElemAt: ['$adminUserCreatedBy', 0] },
                                        else: null
                                    }
                                }
                            }
                        },
                        // Get role information
                        createdByRole: {
                            $ifNull: [
                                { $arrayElemAt: ['$createdByUserRole', 0] },
                                null
                            ]
                        },
                        // Calculate credit details - Convert all values to numbers first
                        creditPeriodNum: {
                            $convert: {
                                input: { $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditPeriod", 0] }, 0] },
                                to: "int",
                                onError: 0,
                                onNull: 0
                            }
                        },
                        creditLimitNum: {
                            $convert: {
                                input: { $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditLimit", 0] }, 0] },
                                to: "double",
                                onError: 0,
                                onNull: 0
                            }
                        }
                    }
                },

                {
                    $project: {
                        // Include all document fields
                        document: "$$ROOT",
                        // Include computed fields
                        totalOrders: 1,
                        totalAmount: 1,
                        lastPurchased: 1,
                        pendingPayments: 1,
                        createdByUser: 1,
                        createdByRole: 1,
                        activeCredits: 1,
                        customervariants: 1,
                        shoptypes: 1,
                    }
                },
                // Second project stage to shape the final response
                {
                    $project: {
                        // Include all original document fields
                        Id: "$document._id",
                        status: "$document.status",
                        name: "$document.name",
                        phone: "$document.phone",
                        mobileNumber: "$document.mobileNumber",
                        customerType: "$document.customerType",
                        email: "$document.email",
                        isDelete: "$document.isDelete",
                        isActive: "$document.isActive",
                        isVerfied: "$document.isVerfied",
                        companyName: "$document.companyName",
                        discount: "$document.discount",
                        contactPersonName: "$document.contactPersonName",
                        designation: "$document.designation",
                        address: "$document.address",
                        location: "$document.location",
                        gstNumber: "$document.gstNumber",
                        createdAt: "$document.createdAt",
                        updatedAt: "$document.updatedAt",
                        customerVariant: "$document.customerVariant",
                        shopType: "$document.shopType",
                        shopImage: "$document.shopImage",
                        createdBy: "$document.createdBy",

                        // Include computed fields
                        totalOrders: 1,
                        totalAmount: 1,
                        lastPurchased: 1,
                        pendingPayments: 1,

                        createdByInfo: {
                            name: {
                                $cond: {
                                    if: { $ne: ['$createdByUser', null] },
                                    then: '$createdByUser.name',
                                    else: ''
                                }
                            },
                            email: {
                                $cond: {
                                    if: { $ne: ['$createdByUser', null] },
                                    then: '$createdByUser.email',
                                    else: ''
                                }
                            },
                            role: {
                                $cond: {
                                    if: { $ne: ['$createdByRole', null] },
                                    then: '$createdByRole.roleName',
                                    else: ''
                                }
                            },
                            roleId: {
                                $cond: {
                                    if: { $ne: ['$createdByRole', null] },
                                    then: '$createdByRole._id',
                                    else: null
                                }
                            }
                        },

                        creditLimit: { $ifNull: [{ $arrayElemAt: ['$activeCredits.creditLimit', 0] }, ''] },
                        creditPeriod: { $ifNull: [{ $arrayElemAt: ['$activeCredits.creditPeriod', 0] }, ''] },
                        customerVariantName: {
                            $ifNull: [{ $arrayElemAt: ['$customervariants.name', 0] }, '']
                        },
                        shopTypeName: {
                            $ifNull: [{ $arrayElemAt: ['$shoptypes.name', 0] }, '']
                        },

                    }
                }
            );

            const countPipeline = [...basePipeline, { $count: 'total' }];
            const dataPipeline = [
                ...basePipeline,
                { $sort: { [resolvedSortBy]: resolvedOrder } },
                { $skip: skip },
                { $limit: resolvedLimit },
            ];

            const [countResult, dataResult] = await Promise.all([
                WholesalerRetailsers.aggregate(countPipeline),
                WholesalerRetailsers.aggregate(dataPipeline)
            ]);

            return Pagination(
                countResult?.[0]?.total || 0,
                dataResult,
                resolvedLimit,
                skip
            );

        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving wholesalers',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async sendOtp(
        phone: string
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {

            const userData = await WholesalerRetailsers.findOne({
                phone: phone
            });
            if (!userData) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }
            const otp = Math.floor(1000 + Math.random() * 9000);
            const user = await WholesalerRetailsers.findByIdAndUpdate({
                _id: userData._id
            },
                {
                    $set: {
                        otp: otp
                    }
                }, { new: true });

            if (!user) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "No user with the given email found in the database."
                );
            }
            if (userData?.email) {
                mailService.commonMailSend("Otp Verify", userData?.email, "Your Verification Code", { name: userData?.name, otp });
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
    async changePassword(
        id: string,
        data: ChangePasswordInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const admin: any = await WholesalerRetailsers.findById(id);
            if (!admin) {
                return createErrorResponse(
                    "error",
                    StatusCodes.BAD_REQUEST,
                    "Wholesaler or Retailer not found"
                );
            }

            const match = await bcrypt.compare(data.oldPin, admin?.pin);
            if (!match) {
                return createErrorResponse(
                    "Old pin is incorrect",
                    StatusCodes.BAD_REQUEST,
                    "Old pin is incorrect"
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
            admin.pin = hashed;
            await admin.save();

            return successResponse(
                "PIN changed successfully",
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

    async changePasswordAfterVerification(
        data: ChangePasswordAfterVerificationInput
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const wholesaler: any = await WholesalerRetailsers.findById(data.userId);
            if (!wholesaler) {
                return createErrorResponse(
                    "Wholesaler not found",
                    StatusCodes.BAD_REQUEST,
                    "error"
                );
            }

            // Check if wholesaler is active and not deleted
            if (!wholesaler.isActive || wholesaler.isDelete) {
                return createErrorResponse(
                    "Wholesaler account is not active",
                    StatusCodes.BAD_REQUEST,
                    "error"
                );
            }

            // Validate PIN format (4-6 digits)
            const pinRegex = /^\d{4,6}$/;
            if (!pinRegex.test(data.newPassword)) {
                return createErrorResponse(
                    "PIN must be 4-6 digits",
                    StatusCodes.BAD_REQUEST,
                    "error"
                );
            }

            // Hash new PIN
            const hashedPin = await bcrypt.hash(data.newPassword, 10);

            // Update PIN (not password)
            wholesaler.pin = hashedPin;
            await wholesaler.save();

            await logAdminUserActivity(
                wholesaler._id.toString(),
                null,
                wholesaler.email || wholesaler.phone,
                'Wholesaler PIN Changed after OTP Verification'
            );

            // Generate new JWT token
            if (!_config?.JwtSecretKey) {
                return createErrorResponse(
                    "Server configuration error",
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "error"
                );
            }

            const token = jwt.sign(
                {
                    id: wholesaler._id.toString(),
                    phone: wholesaler.phone
                },
                _config.JwtSecretKey,
                { expiresIn: '7d' }
            );

            // Save or update token
            const existingToken = await UserToken.findOne({ userId: wholesaler._id });
            if (existingToken) {
                existingToken.token = token;
                existingToken.updatedAt = new Date();
                await existingToken.save();
            } else {
                await UserToken.create({
                    userId: wholesaler._id,
                    token,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Return user data in the specified format (token outside user object)
            const responseData = {
                user: {
                    _id: wholesaler._id.toString(),
                    name: wholesaler.name,
                    email: wholesaler.email || '',
                    phone: wholesaler.phone,
                    isActive: wholesaler.isActive,
                    isDelete: wholesaler.isDelete,
                    isVerfied: wholesaler.isVerfied,
                    customerType: wholesaler.customerType,
                    companyName: wholesaler.companyName || '',
                    contactPersonName: wholesaler.contactPersonName || '',
                    designation: wholesaler.designation || '',
                    mobileNumber: wholesaler.mobileNumber || '',
                    address: wholesaler.address || {},
                    gstNumber: wholesaler.gstNumber || '',
                    shopType: wholesaler.shopType || '',
                    location: wholesaler.location || {},
                    createdAt: wholesaler.createdAt,
                    updatedAt: wholesaler.updatedAt
                },
                token: token
            };

            return successResponse(
                "PIN changed successfully",
                StatusCodes.OK,
                responseData
            );

        } catch (err: any) {
            return createErrorResponse(
                err.message || "Failed to change PIN",
                StatusCodes.INTERNAL_SERVER_ERROR,
                "error"
            );
        }
    }

}

export function newWholesalerRetailerRepository(db: any): IWholesalerRepository {
    return new WholesalerRepository(db);
}
