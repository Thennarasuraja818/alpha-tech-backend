

import { StatusCodes } from "http-status-codes";
import { CreateCustomerInput } from "../../../api/Request/customer";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { IPosRepository } from "../../../domain/admin/posDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import Users from "../../../app/model/user";
import { successResponse } from "../../../utils/common/commonResponse";
import Pagination from "../../../api/response/paginationResponse";
import { CreateOrderInput } from "../../../api/Request/order";
import { OrderModel } from "../../../app/model/order";
import { ProductModel } from "../../../app/model/product";
import { CartModel } from "../../../app/model/cart";
import mongoose, { Types } from "mongoose";
import { PaymentReceiveModel } from "../../../app/model/paymentReceive";
import { CashSettlementModel } from "../../../app/model/CashSettlement";

class PosRepository implements IPosRepository {
    async createCustomer(data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const customer = await Users.findOne({ phone: data.phoneNumber, isActive: 1, isDelete: 0 });
            if (customer) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Cusotmer is already exist!!'
                );
            }
            const result = await Users.insertOne({
                name: data.name,
                phone: data.phoneNumber,
                address: data.address,
                pincode: data.pincode,
                createdBy: data.createdBy,
                modifiedBy: data.createdBy
            });
            if (!result) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Unable to create customer'
                );
            }
            return successResponse("Customer created successfully", StatusCodes.OK, result);

        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
    async getCustomerById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const customers = await Users.findOne({ _id: id, isActive: 1, isDelete: 0 });
            if (!customers) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Cusotmer not found'
                );
            }

            return successResponse("Customer updated successfully", StatusCodes.OK, '');

        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
    async getAllCustomers(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: "asc" | "desc";
    }): Promise<ApiResponse<{ items: []; total: number; limit: number; offset: number; }> | ErrorResponse> {

        try {
            const { limit = 100, offset = 0, search, sortBy = 'createdAt', order = 'desc' } = options;

            const query: any = { isDelete: false, isActive: true };

            // Add search condition if search term is provided
            if (search) {
                const searchRegex = new RegExp(search, 'i'); // case-insensitive search
                query.$or = [
                    { name: { $regex: searchRegex } },
                    { phone: { $regex: searchRegex } }
                ];
            }

            // Build sort object
            const sortOrder = order === 'asc' ? 1 : -1;
            const sortOptions: any = {};
            sortOptions[sortBy] = sortOrder;

            // Fetch users
            const users = await Users.find(query)
                .skip(offset * limit)
                .limit(limit)
                .sort(sortOptions);

            // Count total
            const total = await Users.countDocuments(query);

            return Pagination(total, users, limit, offset);
        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateCustomer(id: string, data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const customers = await Users.findOne({ _id: id, isActive: 1, isDelete: 0 });
            if (!customers) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Cusotmer not found'
                );
            }
            const customer = await Users.findOne({ _id: { $ne: new Types.ObjectId(id) }, phone: data.phoneNumber, isActive: 1, isDelete: 0 });
            if (customer) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Cusotmer is already exist!!'
                );
            }
            const result = await Users.updateOne({ _id: customers._id }, {
                name: data.name,
                phone: data.phoneNumber,
                address: data.address,
                pincode: data.pincode
            });
            if (!result) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Unable to update customer'
                );
            }
            return successResponse("Customer updated successfully", StatusCodes.OK, '');

        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
    async deleteCustomer(id: string, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const customers = await Users.findOne({ _id: id, isActive: 1, isDelete: 0 });
            if (!customers) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Cusotmer not found'
                );
            }

            const result = await Users.updateOne({ _id: customers._id }, {
                isDelete: true,
                modifiedBy: userId
            });
            if (!result) {
                return createErrorResponse(
                    'err',
                    StatusCodes.BAD_REQUEST,
                    'Unable to update customer'
                );
            }
            return successResponse("Customer deleted successfully", StatusCodes.OK, '');

        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
    async createOrder(input: CreateOrderInput, userId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log(input, "inp");
            let previousOrder = null;
            if (input.reorderId) {
                previousOrder = await OrderModel.findById(input.reorderId).session(session);
                if (previousOrder) {
                    await OrderModel.findByIdAndUpdate(
                        input.reorderId,
                        {
                            $set: {
                                status: "reorder",
                                modifiedBy: new Types.ObjectId(userId),
                                updatedAt: new Date()
                            }
                        },
                        { session }
                    )
                    const payments = await PaymentReceiveModel.find(
                        { orderId: input.reorderId, isDelete: false }
                    ).session(session);

                    if (payments.length) {
                        await PaymentReceiveModel.updateMany(
                            { orderId: input.reorderId, isDelete: false },
                            {
                                $set: {
                                    isDelete: true,
                                    modifiedBy: new Types.ObjectId(userId),
                                    updatedAt: new Date()
                                }
                            },
                            { session }
                        );

                        const settlementIds = payments
                            .map(p => p.settlementId)
                            .filter(id => !!id);

                        if (settlementIds.length) {
                            await CashSettlementModel.updateMany(
                                { _id: { $in: settlementIds }, isDelete: false },
                                {
                                    $set: {
                                        isDelete: true,
                                        modifiedBy: new Types.ObjectId(userId),
                                        updatedAt: new Date()
                                    }
                                },
                                { session }
                            );
                        }
                    }
                }
            }
            // Get the latest order by orderCode
            const latestOrder = await OrderModel.findOne({ isActive: 1, isDelete: 0 })
                .sort({ orderCode: -1 })
                .lean();

            let count = latestOrder
                ? parseInt(latestOrder.orderCode.replace(/\D/g, ""), 10) + 1
                : 1;

            let orderCode;
            const invoiceId = await this.generateInvoiceId();

            while (true) {
                orderCode = `ORD-${String(count).padStart(3, '0')}`;
                const exists = await OrderModel.exists({ orderCode, isActive: 1, isDelete: 0 });
                if (!exists) break;
                count++;
            }

            // Calculate totals from input
            const subtotal = input.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const totalAmount = input.totalAmount;

            // Determine payment status
            let paymentStatus: 'pending' | 'partially-paid' | 'paid' | 'failed' = 'pending';
            if (input.paymentDetails && input.paymentDetails.length > 0) {
                const totalPaid = input.paymentDetails.reduce((sum: any, pm: any) => sum + (parseFloat(pm.amount) || 0), 0);
                if (totalPaid >= totalAmount) {
                    paymentStatus = 'paid';
                } else if (totalPaid > 0) {
                    paymentStatus = 'partially-paid';
                }
            }

            // Determine order status - for POS/takeaway, it's immediate
            const isTakeaway = input.orderType === "takeaway";
            const orderStatus = isTakeaway ? "delivered" : "pending";

            // Save the new order
            const doc = new OrderModel({
                ...input,
                orderFrom: 'pos',
                orderCode,
                createdBy: userId,
                modifiedBy: userId,
                invoiceId,
                totalAmount,
                amountPaid: input.paymentDetails?.reduce((sum: any, pm: any) => sum + (parseFloat(pm.amount) || 0), 0) || 0,
                amountPending: Math.max(0, totalAmount - (input.paymentDetails?.reduce((sum: any, pm: any) => sum + (parseFloat(pm.amount) || 0), 0) || 0)),
                paymentStatus,
                status: orderStatus
            });

            const result = await doc.save({ session });

            if (!result) {
                await session.abortTransaction();
                return createErrorResponse('Create error', StatusCodes.NOT_FOUND, 'Unable to place order');
            }

            // Update product stock
            if (input.items && isTakeaway) {
                for (const val of input.items) {
                    try {
                        const product = await ProductModel.findById(val.productId).session(session);
                        if (!product) continue;

                        // If no attributes are provided, skip this product
                        if (!val.attributes) continue;

                        // Prepare for both wholesaler and customer attributes updates
                        const attributeTypes = ['wholesalerAttribute', 'customerAttribute'] as const;

                        for (const attributeType of attributeTypes) {
                            const attributeData = product[attributeType];
                            if (!attributeData?.rowData) continue;

                            // Find matching row in rowData array
                            for (let i = 0; i < attributeData.rowData.length; i++) {
                                const row = attributeData.rowData[i];
                                if (!row) continue;

                                const allAttributesMatch = Object.values(val.attributes).every((attrValue: any) => {
                                    return Object.entries(row).some(([rowKey, rowValue]) =>
                                        !['sku', 'price', 'stock', 'maxLimit'].includes(rowKey) && // exclude non-attribute fields
                                        rowValue?.toString() === attrValue.toString()
                                    );
                                });

                                if (allAttributesMatch && typeof row.stock !== 'undefined') {
                                    // Update the stock
                                    const currentStock = parseInt(row.stock) || 0;
                                    attributeData.rowData[i].stock = (currentStock - val.quantity).toString();
                                    break; // Exit loop after finding the exact match
                                }
                            }
                        }

                        await ProductModel.findByIdAndUpdate(
                            { _id: product._id },
                            { $set: product },
                            { session }
                        );

                    } catch (error) {
                        console.error(`Error updating product ${val.productId}:`, error);
                        // Continue with other products even if one fails
                    }
                }
            }

            // Remove cart details
            await CartModel.updateOne(
                { userId: new Types.ObjectId(input.placedBy), isDelete: 0 },
                { isDelete: 1 },
                { session }
            );

            /** ---------------- Payment Processing ---------------- **/
            if (input.paymentDetails && input.paymentDetails.length > 0) {
                const paymentOps = input.paymentDetails.map((p: any) => ({
                    customerId: result.placedBy,
                    orderId: result._id,
                    dueAmount: totalAmount,
                    paidAmount: parseFloat(p.amount) || 0,
                    paymentDate: new Date(),
                    paymentMethod: p.method,
                    paymentProof: p.reference || "",
                    payInFull: (parseFloat(p.amount) || 0) >= totalAmount,
                    createdBy: userId,
                    modifiedBy: userId,
                    status: "Payment collected",
                    createdFrom: "pos"
                }));

                const payments = await PaymentReceiveModel.insertMany(paymentOps, { session });
                console.log('Payments created:', payments);

                // Create cash settlement for POS payments
                const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);

                if (totalPaid > 0) {
                    const newSettlement = await CashSettlementModel.create(
                        [{
                            cashToBeSettled: totalPaid,
                            settlementMode: "Handover",
                            handoverTo: new Types.ObjectId(userId),
                            settledBy: new Types.ObjectId(userId),
                            settlementDate: new Date(),
                            notes: `POS Order: ${orderCode}`,
                            createdBy: new Types.ObjectId(userId),
                            modifiedBy: new Types.ObjectId(userId),
                            status: "approved"
                        }],
                        { session }
                    );

                    // Update payments with settlement ID
                    await PaymentReceiveModel.updateMany(
                        { _id: { $in: payments.map(p => p._id) } },
                        { $set: { settlementId: newSettlement[0]._id, status: 'completed' } },
                        { session }
                    );
                }

                // Update order with final payment status
                const finalPaymentStatus = totalPaid >= totalAmount ? 'paid' :
                    totalPaid > 0 ? 'partially-paid' : 'pending';

                await OrderModel.findByIdAndUpdate(
                    result._id,
                    {
                        $set: {
                            amountPaid: totalPaid,
                            amountPending: Math.max(0, totalAmount - totalPaid),
                            paymentStatus: finalPaymentStatus,
                            modifiedBy: new Types.ObjectId(userId),
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );
            }

            await session.commitTransaction();

            return successResponse('Order created', StatusCodes.CREATED, {
                message: 'Order placed successfully',
                orderId: result._id,
                orderdata: result,
                orderCode: orderCode
            });

        } catch (e: any) {
            await session.abortTransaction();
            console.error('Error in createOrder:', e);
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        } finally {
            session.endSession();
        }
    }
    async generateInvoiceId(): Promise<string> {
        const latestInvoice = await OrderModel.findOne({
            isActive: 1,
            isDelete: 0,
            orderFrom: "pos"
        })
            .sort({ createdAt: -1 })
            .lean();

        let count = 1;

        if (latestInvoice && latestInvoice.invoiceId) {
            // Remove the 'NALC-' prefix safely
            const numberPart = latestInvoice.invoiceId.replace(/^NALC-/, '');
            count = parseInt(numberPart, 10) + 1;
        }

        return `NALC-${count}`;
    }

}
export function newPosRepository(): IPosRepository {
    return new PosRepository();
}