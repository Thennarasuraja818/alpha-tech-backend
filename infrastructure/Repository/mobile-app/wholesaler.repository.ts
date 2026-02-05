import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { AdminUser } from "../../../api/response/admin.response";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import bcrypt from "bcrypt";
import { _config } from "../../../config/config";
import Users from "../../../app/model/user";
import jwt from "jsonwebtoken";
import UserToken from "../../../app/model/user.token";
// import { IMobileUserRepository } from "../../../domain/mobile-app/user.domain";
import { IWholesalerRepository, WholesalerServiceDomain } from "../../../domain/mobile-app/wholsalerDomain";
import { OtpVerification, AddPin, MobileLoginInput, CreateWholesaler, StatusUpdate, CreditUpdate } from "../../../api/Request/wholesalerRequest";
import { CreateUserMobileApp } from "../../../api/Request/mobileAppUser";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { UploadedFile } from "express-fileupload";
import { Uploads } from "../../../utils/uploads/image.upload";
import mailService from "../../../utils/common/mail.service";
import { ChangePasswordInput } from "../../../api/Request/user";
import { WholeSalerCreditModel } from "../../../app/model/wholesaler.credit";
import wholesaleOrder from "../../../app/model/wholesaleOrder";
import WholesalerVisitModel from "../../../app/model/wholesalerVisit";
import { disconnect } from "process";
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
    async otpVerification(
        data: OtpVerification
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {

            const userData = await WholesalerRetailsers.findOne({
                phone: data.phone
            });
            console.log(userData, 'userData1111111')
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
            const user = await WholesalerRetailsers.findByIdAndUpdate({
                _id: userData._id
            },
                {
                    $set: {
                        isVerfied: true,
                        otp: ''
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

            return successResponse("Success", StatusCodes.OK, user);
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
            const userData = await WholesalerRetailsers.findOne({
                phone: data.phone,
                isActive: 1,
                isDelete: 0,
            });

            if (userData) {
                if (userData.status == "pending") {
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
                    ""
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
                shopImage: imageArr,
            };
            console.log(input, "iiiiiiiiiiii");

            const user = await WholesalerRetailsers.create(input);
            console.log(user, "uuuuuuuu");

            console.log(
                data.paymentTerm,
                " data.paymentTerm data.paymentTerm data.paymentTerm data.paymentTerm"
            );

            const credit = {
                creditLimit: data.creditLimit.toString(),
                creditPeriod: data.creditPeriod.toString(),
                docProof: imageArr,
                wholeSalerId: user._id,
                paymentTerm: data.paymentTerm,
                paymentPreferMode: data.preferredPaymentMode,
                createdBy: new Types.ObjectId(data.createdBy),
            };

            await WholeSalerCreditModel.create(credit);

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
    async updateUser(
        id: string,
        data: CreateWholesaler
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const userData = await WholesalerRetailsers.findOne({
                _id: new Types.ObjectId(id),
                isActive: 1,
                isDelete: 0,
            });

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
                    ""
                );
                imageArr.push(...image);
            }
            data.shopImage = imageArr;

            const findCredit = await WholeSalerCreditModel.findOne({
                wholeSalerId: new Types.ObjectId(id),
                isActive: true,
                isDelete: false,
            });

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
                        findCredit.documentProof[0].docName ?? ""
                    );
                    imageArr.push(...image);
                }

                const isCreditDetailsChanged =
                    await WholeSalerCreditModel.countDocuments({
                        wholeSalerId: new Types.ObjectId(id),
                        isActive: true,
                        isDelete: false,
                        creditLimit: data.creditLimit.toString(),
                        creditPeriod: data.creditPeriod.toString(),
                        paymentTerm: data.paymentTerm,
                        paymentPreferMode: data.preferredPaymentMode,
                        documentProof: imageArr,
                    });

                if (isCreditDetailsChanged == 0) {
                    await WholeSalerCreditModel.updateMany(
                        {
                            wholeSalerId: new Types.ObjectId(id),
                        },
                        {
                            $set: {
                                isActive: false,
                            },
                        }
                    );

                    const credit = {
                        wholeSalerId: new Types.ObjectId(id),
                        creditLimit: data.creditLimit,
                        creditPeriod: data.creditPeriod,
                        paymentTerm: data.paymentTerm,
                        paymentPreferMode: data.preferredPaymentMode,
                        documentProof: imageArr,
                        modifiedBy: new Types.ObjectId(data.modifiedBy),
                    };

                    await WholeSalerCreditModel.create(credit);
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
            };

            const user = await WholesalerRetailsers.findByIdAndUpdate(id, input);

            if (!user) {
                return createErrorResponse(
                    "Unable to update user",
                    StatusCodes.BAD_REQUEST,
                    "Unable to update user"
                );
            }
            return successResponse("User updated successfully", StatusCodes.OK, user);
        } catch (err: any) {
            console.log(err, 'err.message');

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
        // try {
        // Step 1: Check if user exists
        const adminExist: any = await WholesalerRetailsers.findOne({
            phone: data.phone,
            isActive: 1,
            isDelete: 0,
        });

        if (!adminExist) {
            return createErrorResponse("User doesn't exist", 400);
        }

        if (!adminExist?.pin) {
            return createErrorResponse("Please set your PIN to proceed.", 400);
        }
        console.log(adminExist?.pin, 'adminExist?.pin');

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

        // } catch (error: any) {
        //     return createErrorResponse(
        //         "An unexpected error occurred1",
        //         500,
        //         error.message || "Failed to log in"
        //     );
        // }
    }
    async getAll(params: {
        limit?: number;
        page?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        userId?: string;
        type?: string;
    }): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const {
                limit,
                page,
                search,
                sortBy,
                order,
                userId,
                type
            } = params;

            const resolvedLimit = Number(limit) > 0 ? Number(limit) : 10;
            const resolvedPage = Number(page) > 0 ? Number(page) : 1;
            const resolvedSortBy = sortBy || 'createdAt';
            const resolvedOrder = order === 'asc' ? 1 : -1;

            const skip = Math.max((resolvedPage - 1) * resolvedLimit, 0);

            const match: any = {};
            if (type) match.customerType = type;

            if (search) {
                const regex = { $regex: search, $options: 'i' };
                match.$or = [
                    { name: regex },
                    { phone: regex },
                    { mobileNumber: regex }
                ];
            }

            const pipeline: any[] = [];

            if (Object.keys(match).length > 0) {
                pipeline.push({ $match: match });
            }

            pipeline.push(
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
                {
                    $addFields: {
                        totalOrders: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalOrders', 0] }, 0] },
                        totalAmount: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalAmount', 0] }, 0] },
                        lastPurchased: { $ifNull: [{ $arrayElemAt: ['$orderStats.lastPurchased', 0] }, ''] },
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
                    $lookup: {
                        from: 'shoptypes',
                        localField: 'shopType',
                        foreignField: '_id',
                        as: 'shoptypes'
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
                        },

                        usedCreditAmount: {
                            $round: [
                                {
                                    $reduce: {
                                        input: "$creditOrders",
                                        initialValue: 0,
                                        in: {
                                            $add: ["$$value", { $ifNull: ["$$this.adjustedPendingAmount", 0] }]
                                        }
                                    }
                                },
                                2
                            ]
                        },

                        creditLimitNum: {
                            $convert: {
                                input: { $arrayElemAt: ["$wholesalercreditsDtls.creditLimit", 0] },
                                to: "double",
                                onError: 0,
                                onNull: 0
                            }
                        },

                    }
                }
                ,
                {
                    $addFields: {
                        creditLimit: "$creditLimitNum",
                        availableCreditAmount: {
                            $round: [
                                {
                                    $max: [
                                        0,
                                        { $subtract: ["$creditLimitNum", "$usedCreditAmount"] }
                                    ]
                                },
                                2
                            ]
                        }
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
                        // creditLimit: {
                        //     $ifNull: [{ $arrayElemAt: ['$activeCredits.creditLimit', 0] }, '']
                        // },
                        creditPeriod: {
                            $ifNull: [{ $arrayElemAt: ['$activeCredits.creditPeriod', 0] }, '']
                        },
                        createdAt: 1,
                        updatedAt: 1,
                        shopTypeName: {
                            $ifNull: [{ $arrayElemAt: ['$shoptypes.name', 0] }, '']
                        },
                        shopType: 1,
                        availableCreditAmount: 1,
                        usedCreditAmount: 1,
                        creditLimit: 1
                    }
                },
                {
                    $sort: { [resolvedSortBy]: resolvedOrder }
                }
            );

            const countPipeline = [...pipeline, { $count: 'total' }];
            const dataPipeline = [...pipeline, { $skip: skip }, { $limit: resolvedLimit }];

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

}

export function newWholesalerRepository(db: any): IWholesalerRepository {
    return new WholesalerRepository(db);
}
