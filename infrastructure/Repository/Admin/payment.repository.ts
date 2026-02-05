
import { createErrorResponse } from "../../../utils/common/errors";
import { StatusCodes } from "http-status-codes";
import { OrderModel } from "../../../app/model/order";
import { ProductModel } from "../../../app/model/product";
import Attribute from "../../../app/model/attribute";
import Pagination from "../../../api/response/paginationResponse";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import Users from "../../../app/model/user";
import moment from 'moment';
import { IPaymentRepository } from "../../../domain/admin/paymentDomain";
import Vendorpurchase from "../../../app/model/vendor.purchase";

export class PaymentReposity implements IPaymentRepository {
    async orderlists(params: {
        page: number;
        limit: number;
        type?: string;
        userId: string;
        orderType: string;
        Id: string;
        status?: string;
        orderCode?: string;
    }) {
        try {
            const { page, limit } = params;

            if (page < 0) {
                throw new Error('Invalid pagination parameters');
            }

            const operation: any[] = [];

            operation.push({
                $match: {
                    isActive: true,
                    isDelete: false,
                    placedByModel: { $in: ['AdminUser', 'Wholesaler', 'Retailer'] },
                    paymentStatus: { $in: ['paid', 'partially-paid'] }
                }
            });

            operation.push(
                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        localField: 'placedBy',
                        foreignField: '_id',
                        as: 'wholesalerretailers',
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        orderCode: 1,
                        amountPaid: 1,
                        amountPending: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        vendorName: { $arrayElemAt: ['$wholesalerretailers.name', 0] },
                        deliveryCharge: 1,
                        createdAt: 1,
                        totalAmount: { $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }] },
                        source: { $literal: 'order' },
                        invoiceId: 1
                    }
                }
            );

            const orderResults = await OrderModel.aggregate(operation);

            const vendorResults = await Vendorpurchase.aggregate([
                {
                    $match: {
                        isDelete: false,
                        isActive: true,
                        paymentStatus: { $in: ['Partially Paid', 'Paid'] }
                    }
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendors'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        orderCode: "$orderId",
                        invoiceId: 1,
                        totalAmount: '$totalPrice',
                        amountPaid: 1,
                        amountPending: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        vendorName: { $arrayElemAt: ['$vendors.name', 0] },
                        deliveryCharge: { $literal: 0 },
                        createdAt: 1,
                        source: { $literal: 'vendorpurchase' }
                    }
                }
            ]);

            // Combine both result arrays
            const combinedResults = [...orderResults, ...vendorResults];

            // Sort by createdAt descending (or adjust as needed)
            combinedResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Pagination manually
            const total = combinedResults.length;
            console.log(combinedResults, 'combinedResults', page, limit);

            const startIndex = page * limit;
            const endIndex = startIndex + limit;

            const paginatedResults = combinedResults.slice(startIndex, endIndex);


            return Pagination(total, paginatedResults, limit, page);

        } catch (e: any) {
            console.error('Error in orderlists:', e);
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async unpaidorderlists(params: {
        page: number;
        limit: number;
    }) {
        try {
            const { page, limit } = params;

            if (page < 0) {
                throw new Error('Invalid pagination parameters');
            }

            const operation: any[] = [];

            operation.push({
                $match: {
                    isActive: true,
                    isDelete: false,
                    placedByModel: { $in: ['AdminUser', 'Wholesaler', 'Retailer'] },
                    paymentStatus: { $in: ['pending', 'partially-paid', 'failed'] }
                }
            });

            operation.push(
                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        localField: 'placedBy',
                        foreignField: '_id',
                        as: 'wholesalerretailers',
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        orderCode: 1,
                        amountPaid: 1,
                        amountPending: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        vendorName: { $arrayElemAt: ['$wholesalerretailers.name', 0] },
                        deliveryCharge: 1,
                        createdAt: 1,
                        totalAmount: { $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }] },
                        source: { $literal: 'order' },
                        invoiceId: 1
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            );

            const orderResults = await OrderModel.aggregate(operation);

            const vendorResults = await Vendorpurchase.aggregate([
                {
                    $match: {
                        isDelete: false,
                        isActive: true,
                        paymentStatus: { $in: ['pending', 'partially-paid', 'failed'] }
                    }
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendors'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        orderCode: "$orderId",
                        invoiceId: 1,
                        totalAmount: '$totalPrice',
                        amountPaid: 1,
                        amountPending: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        vendorName: { $arrayElemAt: ['$vendors.name', 0] },
                        deliveryCharge: { $literal: 0 },
                        createdAt: 1,
                        source: { $literal: 'vendorpurchase' }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]);

            // Combine both result arrays
            const combinedResults = [...orderResults, ...vendorResults];
            // Pagination manually
            const total = combinedResults.length;
            console.log(combinedResults, 'combinedResults', page, limit);

            const startIndex = page * limit;
            const endIndex = startIndex + limit;

            const paginatedResults = combinedResults.slice(startIndex, endIndex);


            return Pagination(total, paginatedResults, limit, page);

        } catch (e: any) {
            console.error('Error in orderlists:', e);
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async dailypaymentlists(params: {
        page: number;
        limit: number;
    }) {
        try {
            const { page, limit } = params;

            if (page < 0) {
                throw new Error('Invalid pagination parameters');
            }
            const startDate = moment().clone().startOf('day').toDate();
            const endDate = moment().clone().endOf('day').toDate();
            const operation: any[] = [];

            operation.push({
                $match: {
                    isActive: true,
                    isDelete: false,
                    placedByModel: { $in: ['AdminUser', 'Wholesaler', 'Retailer'] },
                    paymentStatus: { $in: ['paid', 'partially-paid', 'failed'] },
                    updatedAt: { $gte: startDate, $lte: endDate }
                }
            });

            operation.push(
                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        localField: 'placedBy',
                        foreignField: '_id',
                        as: 'wholesalerretailers',
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        orderCode: 1,
                        amountPaid: 1,
                        amountPending: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        vendorName: { $arrayElemAt: ['$wholesalerretailers.name', 0] },
                        deliveryCharge: 1,
                        createdAt: 1,
                        totalAmount: { $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }] },
                        source: { $literal: 'order' },
                        invoiceId: 1
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            );

            const orderResults = await OrderModel.aggregate(operation);

            const vendorResults = await Vendorpurchase.aggregate([
                {
                    $match: {
                        isDelete: false,
                        isActive: true,
                        paymentStatus: { $in: ['paid', 'partially-paid', 'failed'] },
                        updatedAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendors'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        orderCode: "$orderId",
                        invoiceId: 1,
                        totalAmount: '$totalPrice',
                        amountPaid: 1,
                        amountPending: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        vendorName: { $arrayElemAt: ['$vendors.name', 0] },
                        deliveryCharge: { $literal: 0 },
                        createdAt: 1,
                        source: { $literal: 'vendorpurchase' }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]);

            // Combine both result arrays
            const combinedResults = [...orderResults, ...vendorResults];
            // Pagination manually
            const total = combinedResults.length;
            console.log(combinedResults, 'combinedResults', page, limit);

            const startIndex = page * limit;
            const endIndex = startIndex + limit;

            const paginatedResults = combinedResults.slice(startIndex, endIndex);


            return Pagination(total, paginatedResults, limit, page);

        } catch (e: any) {
            console.error('Error in orderlists:', e);
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
}

export function newPaymentRepository(): IPaymentRepository {
    return new PaymentReposity();
}
