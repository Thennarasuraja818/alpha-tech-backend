import { Types } from 'mongoose';
import { Request, Response } from 'express';
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from '../../../utils/common/errors';
import { StatusCodes } from 'http-status-codes';
import { ErrorResponse } from '../../../api/response/cmmonerror';
import { ApiResponse } from '../../../api/response/commonResponse';
import { IRazorpayRepository } from '../../../domain/mobile-app/razorpayDomain';
import Pagination, { PaginationResult } from '../../../api/response/paginationResponse';
import { Wallet } from '../../../app/model/wallet';
import { CreateRazorpayInput } from '../../../api/Request/razorpayInput';
import { RazorpayService } from '../../../app/service/mobile-app/razorpay.service';
import { WalletTransaction } from '../../../app/model/wallet.history';

// Create a simple PaymentModel interface since we don't have the actual model
export class RazorpayRepository implements IRazorpayRepository {
    constructor(private db: any) { }

    async handleJuspayResponse(req: Request, res: Response<any>): Promise<any> {
        try {
            // const orderId = req.query.order_id || req.body.orderId || req.body.order_id;
            // console.log("🔄 Processing Juspay response for order:", orderId);

            // if (!orderId) {
            //     return createErrorResponse(
            //         "Order ID is required",
            //         StatusCodes.BAD_REQUEST,
            //         "Order ID not provided"
            //     );
            // }

            // const paymentStatus = await hdfcPayment.handleJuspayResponse(orderId);
            // if (!paymentStatus || paymentStatus.status === 'ERROR') {
            //     return res.status(StatusCodes.BAD_REQUEST).json({
            //         status: "error",
            //         message: "Failed to verify payment status",
            //         data: paymentStatus
            //     });
            // }

            // const paymentData = paymentStatus;
            // console.log("📊 Payment data received:", paymentData);

            // // 1️⃣ Check if payment record already exists with same details
            // const existingPayment = await Payment.findOne({
            //     $or: [
            //         {
            //             orderId: paymentData.order_id || orderId,
            //             txnId: paymentData.payment_id || paymentData.txn_id
            //         },
            //         {
            //             orderId: paymentData.order_id || orderId,
            //             paymentStatus: paymentData.status,
            //             amount: paymentData.amount || 0
            //         },
            //         {
            //             gatewayTransactionId: paymentData.payment_gateway_response?.epg_txn_id
            //         }
            //     ]
            // });

            // if (existingPayment) {
            //     console.log('⚠️ Payment record already exists, skipping creation:', {
            //         orderId: paymentData.order_id || orderId,
            //         txnId: paymentData.payment_id || paymentData.txn_id,
            //         status: paymentData.status
            //     });
            // } else {
            //     // 2️⃣ Create payment record only if it doesn't exist
            //     const paymentRecord = await Payment.create({
            //         orderId: paymentData.order_id || orderId,
            //         txnId: paymentData.payment_id || paymentData.txn_id || `txn_${Date.now()}`,
            //         customerId: paymentData.customer_id,
            //         amount: paymentData.amount ? paymentData.amount : 0,
            //         currency: paymentData.currency || 'INR',
            //         paymentMethod: paymentData.payment_method,
            //         cardBrand: paymentData.card?.card_brand,
            //         lastFourDigits: paymentData.card?.last_four_digits,
            //         paymentStatus: paymentData.status,
            //         paymentGateway: "HDFC_Juspay",
            //         gatewayTransactionId: paymentData.payment_gateway_response?.epg_txn_id,
            //         rrn: paymentData.payment_gateway_response?.rrn,
            //         paymentDate: new Date(paymentData.last_updated || new Date()),
            //         rawResponse: paymentData,
            //         createdAt: new Date(),
            //         updatedAt: new Date()
            //     });

            //     console.log('✅ New payment record created:', paymentRecord._id);
            // }

            // // 3️⃣ Update order status in Orders collection
            // let orderUpdateData: any = {
            //     paymentStatus: paymentData.status === "CHARGED" ? "paid" : "failed",
            //     paymentDate: new Date(paymentData.last_updated || new Date()),
            //     hdfcJustPay_payment_id: paymentData.payment_id,
            //     hdfcJustPay_signature: paymentData.signature,
            //     updatedAt: new Date()
            // };

            // const updatedOrder = await OrderModel.findOneAndUpdate(
            //     {
            //         $or: [
            //             { hdfcJustPay_order_id: orderId },
            //         ]
            //     },
            //     { $set: orderUpdateData },
            //     { new: true }
            // );

            // console.log(updatedOrder ? '✅ Order updated successfully' : '⚠️ Order not found for orderId:', orderId);

            // // 4️⃣ Count payment attempts for this order
            // const paymentAttemptsCount = await Payment.countDocuments({
            //     orderId: paymentData.order_id || orderId
            // });

            // console.log(`📊 Total payment attempts for order ${orderId}: ${paymentAttemptsCount}`);
            // // const order = await hdfcPayment.getPaymentDetails(orderId);
            // // console.log(order, 'ssssssssssssssssssssss');

            // // 5️⃣ Redirect to frontend success/failure page
            // const frontendBaseUrl = process.env.FRONTEND_URL || 'https://admin.rameshtraders.in/handleJuspayResponse';

            // if (paymentData.status === "CHARGED") {
            //     if (paymentData.udf1 === 'Mobile') {

            //         return successResponse('Order created', StatusCodes.CREATED, { message: 'Success' });

            //     } else {
            //         return res.redirect(
            //             `${frontendBaseUrl}?orderId=${orderId}&paymentId=${paymentData.id}&status=success&attempts=${paymentAttemptsCount}`
            //         );
            //     }

            // } else {
            //     if (paymentData.udf1 === 'Mobile') {

            //         return successResponse('Order created', StatusCodes.CREATED, { message: 'Failure' });

            //     } else {

            //     } return res.redirect(
            //         `${frontendBaseUrl}?orderId=${orderId}&reason=${paymentData.status}&status=failure&attempts=${paymentAttemptsCount}`
            //     );
            // }

        } catch (err: any) {
            console.error('❌ Error handling Juspay response:', err);
            return createErrorResponse(
                "Error handling Juspay response",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }

    // ... keep all your existing methods (getWalletHistory, getUserWallet, generateQRforPayment, getPaymentDetails)
    async getWalletHistory(params: any): Promise<PaginationResult<any[]> | ErrorResponse> {
        try {
            const limit = params.limit ?? 10;
            const page = params.page ?? 1;
            const skip = (page - 1) * limit;

            const userWallet = await Wallet.findOne({
                userId: new Types.ObjectId(params.userId),
                isActive: true,
                isDelete: false
            });
            console.log(userWallet, params.userId);

            if (!userWallet) {
                return createErrorResponse(
                    "Wallet not found",
                    StatusCodes.NOT_FOUND,
                    "User wallet details not found"
                );
            }

            const pipeline: any[] = [
                {
                    $match: {
                        walletId: userWallet._id,
                        isActive: true,
                        isDelete: false
                    }
                },
                {
                    $addFields: {
                        transactionType: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $gt: ["$balanceAfter", "$balanceBefore"] },
                                        then: "Increase"
                                    },
                                    {
                                        case: { $lt: ["$balanceAfter", "$balanceBefore"] },
                                        then: "Decrease"
                                    }
                                ],
                                default: "No Change"
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "orders",
                        localField: "orderId",
                        foreignField: "_id",
                        as: "orders",
                        pipeline: [{ $project: { orderCode: 1 } }]
                    }
                },
                {
                    $project: {
                        walletId: 1,
                        userId: 1,
                        amount: 1,
                        balanceBefore: 1,
                        balanceAfter: 1,
                        orderId: 1,
                        referenceType: 1,
                        description: 1,
                        transactionType: 1,
                        orderCode: { $arrayElemAt: ["$orders.orderCode", 0] },
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ];

            const count = await WalletTransaction.countDocuments({
                isActive: true,
                isDelete: false,
                walletId: userWallet._id
            });

            const data = await WalletTransaction.aggregate(pipeline);

            return Pagination(count, data, limit, page);

        } catch (err: any) {
            return createErrorResponse(
                "Error getting wallet history",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }

    async getUserWallet(userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const userWallet = await Wallet.findOne({
                userId: new Types.ObjectId(userId),
                isActive: true,
                isDelete: false
            });

            if (!userWallet) {
                return createErrorResponse(
                    "Wallet not found",
                    StatusCodes.NOT_FOUND,
                    "User wallet details not found"
                );
            }

            return successResponse("User wallet details retrieved successfully", StatusCodes.OK, userWallet);
        } catch (err: any) {
            return createErrorResponse(
                "Error getting wallet",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }

    async generateQRforPayment(input: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            // Handle Razorpay QR flow
            // if (input.paymentMethod === "QR Code" && !input?.razorpayOrderId && input?.customerId) {
            //     const payment = await razorService.handleRazorpayPayment(
            //         { totalAmount: input.amount, paymentMethod: input.paymentMethod },
            //         input?.customerId
            //     );

            //     return successResponse("Payment initiated via QR", StatusCodes.OK, {
            //         ...payment,
            //         amount: input.amount
            //     });
            // }

            // let paymentDetails: any = null;
            // if (input?.razorpayOrderId) {
            //     paymentDetails = await razorService.fetchRazorpayPaymentDetails(input.razorpayOrderId);
            //     if (paymentDetails === null || paymentDetails?.status === 'failed') {
            //         return createErrorResponse(
            //             "Payment Failed",
            //             StatusCodes.BAD_REQUEST,
            //             "Payment details not found or payment failed"
            //         );
            //     }
            // }

            return successResponse("Payment received successfully", StatusCodes.OK, {});
        } catch (err: any) {
            return createErrorResponse(
                "Error receiving payment",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }

    async getPaymentDetails(input: CreateRazorpayInput): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            let paymentDetails: any = null;

            // if (input?.razorpayOrderId) {
            //     console.log(input.razorpayOrderId, 'razorpayOrderId');
            //     paymentDetails = await RazorpayService.fetchRazorpayPaymentDetails(input.razorpayOrderId);

            //     if (paymentDetails === null || paymentDetails?.status === 'failed') {
            //         return createErrorResponse(
            //             "Payment Failed",
            //             StatusCodes.BAD_REQUEST,
            //             "Payment details not found or payment failed"
            //         );
            //     }
            // }

            return successResponse("Payment details retrieved successfully", StatusCodes.OK, paymentDetails);
        } catch (err: any) {
            return createErrorResponse(
                "Error fetching payment details",
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
}

export const RazorpaysRepository = (db: any) => new RazorpayRepository(db);