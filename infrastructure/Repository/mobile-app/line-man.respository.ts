import { Types } from 'mongoose';
import { sendErrorResponse, successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from '../../../utils/common/errors';
import { StatusCodes } from 'http-status-codes';
import { ILinemanRepository } from '../../../domain/mobile-app/line-manDomain';
import { ErrorResponse } from '../../../api/response/cmmonerror';
import { ApiResponse, SuccessMessage } from '../../../api/response/commonResponse';
import { CreateVisitTracker } from '../../../api/Request/visitrackerReq';
import WholesalerVisitModel from '../../../app/model/wholesalerVisit';
import { PaymentReceiveModel } from '../../../app/model/paymentReceive';
import { ReceivePaymentInput } from '../../../api/Request/receivePayment';
import { OrderModel } from '../../../app/model/order';
import moment from 'moment';
import { AnyConnectionBulkWriteModel } from 'mongoose';
import { CashSettlementModel } from '../../../app/model/CashSettlement';
import { ReceiveCashSettlementInput } from '../../../api/Request/cashsettle';
import Pagination, { PaginationResult } from '../../../api/response/paginationResponse';
import { UserlistSchema } from '../../../api/Request/user';
import { User } from '../../../api/response/user.response';
import AdminUsers from '../../../app/model/admin.user';
import { SalesandTargets } from '../../../app/model/salesandtargets';
import { RootModel } from '../../../app/model/root';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
import { Uploads } from '../../../utils/uploads/image.upload';
import { ShopTypeListQuerySchema } from '../../../api/Request/shop.type';
import { ShopTypeListParams } from '../../../domain/admin/shop.typeDomain';
import ShopTypes from '../../../app/model/shop.type';
import { RootListParams } from '../../../domain/admin/root.Domain';
import { ShopTypeDocumentResponse } from '../../../api/response/shop.type';

export class LinemanRepository implements ILinemanRepository {
    constructor(private db: any) { }
    async getOutstandingPayments(params: any) {
        try {
            const userId = new Types.ObjectId(params.userId);
            const monthMap: { [key: string]: number } = {
                January: 0, February: 1, March: 2, April: 3,
                May: 4, June: 5, July: 6, August: 7,
                September: 8, October: 9, November: 10, December: 11
            };

            const monthName = params.month; // 'July'
            const year = parseInt(params.year);

            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (monthName && !isNaN(year)) {
                const monthIndex = monthMap[monthName];
                if (monthIndex !== undefined) {
                    startDate = new Date(year, monthIndex, 1);
                    endDate = new Date(year, monthIndex + 1, 1);
                }
            }

            // Step 1: Find the user
            const user = await AdminUsers.findOne({
                _id: userId,
                isActive: true,
                isDelete: false
            });

            if (!user) {
                return createErrorResponse('Not found', StatusCodes.NOT_FOUND, 'User not found');
            }

            // Step 2: Get route
            const route = await RootModel.findOne({
                salesman: user._id,
                isActive: true,
                isDelete: false
            });

            if (!route) {
                return createErrorResponse('Not found', StatusCodes.NOT_FOUND, 'Route not found');
            }

            const pincodes = route.pincode?.map(e => e.code) ?? [];

            // Step 3: Get wholesalers in those pincodes
            const wholesalersInPincode = await WholesalerRetailsers.aggregate([
                {
                    $match: {
                        'address.postalCode': { $in: pincodes },
                        ...(startDate && endDate
                            ? {
                                'createdAt': {
                                    $gte: startDate,
                                    $lt: endDate
                                }
                            }
                            : {})
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        isActive: { $first: '$isActive' }
                    }
                }
            ]);

            const totalWholesalers = wholesalersInPincode.length;
            // const inactiveWholesalers = wholesalersInPincode.filter(w => !w.isActive).length;
            const inactiveWholesalers = await WholesalerRetailsers.aggregate([
                {
                    $match: {
                        'address.postalCode': { $in: pincodes },
                        isDelete: false,
                        isActive: true
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        let: { customerId: '$_id', customerPincode: '$address.postalCode' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$placedBy', '$$customerId'] },
                                            { $in: ['$shippingAddress.postalCode', pincodes] }
                                        ]
                                    }
                                }
                            },
                            { $sort: { createdAt: -1 } },
                            { $limit: 1 }
                        ],
                        as: 'lastOrder'
                    }
                },
                // Only keep wholesalers who have at least 1 order
                { $unwind: { path: '$lastOrder', preserveNullAndEmptyArrays: false } },
                {
                    $addFields: {
                        daysSinceLastOrder: {
                            $divide: [
                                { $subtract: [new Date(), '$lastOrder.createdAt'] },
                                1000 * 60 * 60 * 24
                            ]
                        },
                        lastOrderDate: '$lastOrder.createdAt'
                    }
                },
                {
                    $match: {
                        daysSinceLastOrder: { $gt: 30 } // inactive for more than 1 month
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        companyName: 1,
                        phone: 1,
                        address: 1,
                        lastOrderDate: {
                            $dateToString: {
                                format: '%d %b %Y',
                                date: '$lastOrderDate'
                            }
                        },
                        daysSinceLastOrder: { $round: ['$daysSinceLastOrder', 0] }
                    }
                }
            ]);

            // Step 4: Get outstanding payments
            const outstandingPayments = await WholesalerRetailsers.aggregate([
                {
                    $match: {
                        isActive: true,
                        isDelete: false
                    }
                },
                {
                    $match: {
                        'address.postalCode': { $in: pincodes }
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'placedBy',
                        as: 'orders'
                    }
                },
                { $unwind: '$orders' },
                {
                    $match: {
                        'orders.paymentStatus': { $in: ['pending', 'partially-paid'] },
                        'orders.paymentMode': 'CREDIT',
                        ...(startDate && endDate
                            ? {
                                'orders.createdAt': {
                                    $gte: startDate,
                                    $lt: endDate
                                }
                            }
                            : {})
                    }
                },
                {
                    $group: {
                        _id: null,
                        pendingAmount: {
                            $sum: {
                                $subtract: [
                                    {
                                        $add: [
                                            '$orders.totalAmount',
                                            { $ifNull: ['$orders.deliveryCharge', 0] }
                                        ]
                                    },
                                    { $ifNull: ['$orders.amountPaid', 0] }
                                ]
                            }
                        }
                    }
                }
            ]);


            return successResponse('Outstanding payments retrieved successfully', StatusCodes.OK, {
                message: 'Outstanding payments retrieved successfully',
                totalWholesalers,
                inactiveWholesalers: inactiveWholesalers?.length > 0 ? inactiveWholesalers.length : 0,
                outstandingPayments: outstandingPayments?.[0]?.pendingAmount ?? 0
            });

        } catch (e: any) {
            return createErrorResponse('Server error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async getSalesPerformanceByUser(params: any) {
        try {
            const userId = new Types.ObjectId(params.userId);
            const filterType = params.dateFilter; // 'today', 'yesterday', 'thisWeek', 'thisMonth', 'thisYear', 'overAll'

            // Step 1: Set date range
            let startDate: Date | undefined;
            let endDate: Date | undefined;
            const now = moment();

            switch (filterType) {
                case 'today':
                    startDate = now.clone().startOf('day').toDate();
                    endDate = now.clone().endOf('day').toDate();
                    break;
                case 'yesterday':
                    startDate = now.clone().subtract(1, 'day').startOf('day').toDate();
                    endDate = now.clone().subtract(1, 'day').endOf('day').toDate();
                    break;
                case 'thisWeek':
                    startDate = now.clone().startOf('week').toDate();
                    endDate = now.clone().endOf('week').toDate();
                    break;
                case 'thisMonth':
                    startDate = now.clone().startOf('month').toDate();
                    endDate = now.clone().endOf('month').toDate();
                    break;
                case 'thisYear':
                    startDate = now.clone().startOf('year').toDate();
                    endDate = now.clone().endOf('year').toDate();
                    break;
                case 'overAll':
                    // no date filtering
                    break;
            }

            // Step 2: Get wholesalers created by the user with date filter
            const wholesalerMatch: any = {
                createdBy: userId,
                isActive: true,
                isDelete: false
            };

            if (startDate && endDate) {
                wholesalerMatch.createdAt = { $gte: startDate, $lte: endDate };
            }

            const totalWholesalers = await WholesalerRetailsers.countDocuments(wholesalerMatch);

            const wholesalers = await WholesalerRetailsers.find({
                createdBy: userId,
                isActive: true,
                isDelete: false
            }).select('_id');
            const wholesalerIds = wholesalers.map(w => w._id);

            // Step 3: Filter for orders
            const orderMatch: any = {
                // placedBy: { $in: wholesalerIds },
                isDelete: false,
                createdBy: new Types.ObjectId(userId),
                status: { $nin: ['cancelled', 'reorder'] }
            };

            if (startDate && endDate) {
                orderMatch.createdAt = { $gte: startDate, $lte: endDate };
            }

            // Step 4: Aggregate order stats
            const orderStats = await OrderModel.aggregate([
                { $match: orderMatch },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalSaleValue: {
                            $sum: {
                                $add: [
                                    '$totalAmount',
                                    { $ifNull: ['$deliveryCharge', 0] }
                                ]
                            }
                        }
                    }
                }
            ]);

            const totalOrders = orderStats[0]?.totalOrders ?? 0;
            const totalSaleValue = orderStats[0]?.totalSaleValue ?? 0;

            return successResponse('Sales performance retrieved', StatusCodes.OK, {
                message: 'Sales performance retrieved',
                totalWholesalers,
                totalOrders,
                totalSaleValue
            });

        } catch (e: any) {
            return createErrorResponse('Server error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async getPaymentDueList(params: any) {
        try {
            const userId = new Types.ObjectId(params.userId);
            const placedBy = params.placedBy ?? '';
            const filterType = params.dateFilter;
            const customStartDate = params.startDate ? new Date(params.startDate) : null;
            const customEndDate = params.endDate ? new Date(params.endDate) : null;

            // Step 1: Generate date range based on filter
            let startDate: Date | undefined;
            let endDate: Date | undefined;
            const now = moment().utc(); // Use UTC to avoid timezone issues

            // If custom dates are provided, they take precedence over filterType
            if (customStartDate && customEndDate) {
                startDate = new Date(customStartDate.setHours(0, 0, 0, 0));
                endDate = new Date(customEndDate.setHours(23, 59, 59, 999));
            } else {
                // Use filterType only if custom dates aren't provided
                switch (filterType) {
                    case 'today':
                        startDate = now.clone().startOf('day').toDate();
                        endDate = now.clone().endOf('day').toDate();
                        break;
                    case 'yesterday':
                        startDate = now.clone().subtract(1, 'day').startOf('day').toDate();
                        endDate = now.clone().subtract(1, 'day').endOf('day').toDate();
                        break;
                    case 'thisWeek':
                        startDate = now.clone().startOf('week').toDate();
                        endDate = now.clone().endOf('week').toDate();
                        break;
                    case 'thisMonth':
                        startDate = now.clone().startOf('month').toDate();
                        endDate = now.clone().endOf('month').toDate();
                        break;
                    case 'thisYear':
                        startDate = now.clone().startOf('year').toDate();
                        endDate = now.clone().endOf('year').toDate();
                        break;
                    case 'overdue':
                        // For overdue items, we want all items where dueDate is before now
                        endDate = now.clone().toDate();
                        break;
                    case 'upcoming':
                        // For upcoming items, we want all items where dueDate is after now
                        startDate = now.clone().toDate();
                        break;
                    case 'overAll':
                        // No date filtering
                        break;
                    default:
                        // Default case - no date filtering or handle as needed
                        break;
                }
            }

            // Step 2: Get wholesalers created by the user with date filter
            const wholesalerMatch: any = {
                isActive: true,
                isDelete: false
            };
            if (userId && params.type === 'lineman') {
                wholesalerMatch.createdBy = userId;
            }
            if (placedBy) {
                wholesalerMatch._id = new Types.ObjectId(placedBy);
            }
            const query: any = {
                isActive: true,
                isDelete: false
            };

            if (params.type === 'deliveryman') {
                query.deliveryman = userId;
            } else if (params.type === 'lineman') {
                query.salesman = userId;
            }

            const route = await RootModel.findOne(query);
            const pincodes = route?.pincode?.map(e => e.code) ?? [];
            const match: any = {
                isDelete: false,
                paymentStatus: { $ne: 'paid' },
                paymentMode: 'CREDIT',
                'shippingAddress.postalCode': { $in: pincodes }
            };

            // Apply date filtering based on the scenario
            if (startDate && endDate) {
                match.dueDate = { $gte: startDate, $lte: endDate };
            } else if (filterType === 'overdue') {
                match.dueDate = { $lt: endDate };
            } else if (filterType === 'upcoming') {
                match.dueDate = { $gt: startDate };
            }
            const operation: any[] = [];

            // Step 1: Filter Orders by PlacedBy and Payment

            if (placedBy || params.type === 'deliveryman') {
                operation.push(
                    {
                        $lookup: {
                            from: 'paymentreceives',
                            let: { orderId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$orderId', '$$orderId'] },
                                                { $eq: ['$isDelete', false] } // optional: ensure not deleted
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$orderId',
                                        totalPaidAmount: { $sum: '$paidAmount' }
                                    }
                                }
                            ],
                            as: 'paymentInfo'
                        }
                    }

                );
            }

            // Step 2: Enrich with Wholesaler Info
            operation.push(
                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        localField: 'placedBy',
                        foreignField: '_id',
                        as: 'wholesalerretailers'
                    }
                },
                {
                    $unwind: {
                        path: '$wholesalerretailers',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'wholesalercredits',
                        localField: 'wholesalerretailers._id',
                        foreignField: 'wholeSalerId',
                        as: 'wholesalercredits'
                    }
                },
                {
                    $unwind: {
                        path: '$wholesalercredits',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        creditPeriodDays: {
                            $toInt: '$wholesalercredits.creditPeriod'
                        },
                        dueDate: {
                            $dateAdd: {
                                startDate: '$createdAt',
                                unit: 'day',
                                amount: { $toInt: '$wholesalercredits.creditPeriod' }
                            }
                        }
                    }
                }
            );

            // Step 3: Apply Match (after dueDate is added)
            if (match) {
                operation.push({ $match: match });
            }

            // Step 4: Project final fields
            operation.push(
                {
                    $project: {
                        customerName: '$wholesalerretailers.name',
                        orderCode: 1,
                        dueDate: 1,
                        createdAt: 1,
                        totalAmount: {
                            $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }]
                        },
                        paidAmount: {
                            $ifNull: [{ $arrayElemAt: ['$paymentInfo.totalPaidAmount', 0] }, 0]
                        },
                        outstandingAmount: {
                            $subtract: [
                                { $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }] },
                                { $ifNull: [{ $arrayElemAt: ['$paymentInfo.totalPaidAmount', 0] }, 0] }
                            ]
                        },
                        isOverdue: {
                            $cond: {
                                if: { $lt: ['$dueDate', new Date()] },
                                then: true,
                                else: false
                            }
                        },
                        shippingAddress: 1,
                        placedBy: 1
                    }
                },

                { $sort: { dueDate: 1 } }
            );
            if (placedBy || params.type === 'deliveryman') {
                operation.push({
                    $match: {
                        outstandingAmount: { $gt: 0 }
                    }
                })
            }
            // Step 5: Execute aggregation
            // const dueOrders = await OrderModel.aggregate(operation);
            const dueOrders = await OrderModel.aggregate(operation);
            const pdfUrl = await Uploads.generateDynamicPDF(
                dueOrders, // Your array of outstanding order objects
                String(userId),  // The user ID
                {
                    title: 'Outstanding Orders Report',
                    logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                    columns: [
                        {
                            header: 'Customer Name',
                            field: 'customerName',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Order No',
                            field: 'orderCode',
                            type: 'text',
                            align: 'center'
                        },
                        {
                            header: 'Outstanding Amount (₹)',
                            field: 'outstandingAmount',
                            type: 'currency',
                            align: 'left',
                            // highlight: [
                            //     {
                            //         condition: (val) => val > 0,
                            //         class: 'danger-cell'
                            //     }
                            // ]
                        },
                        {
                            header: 'Due Date',
                            field: 'dueDate',
                            type: 'date',
                            align: 'left'
                            // highlight: [
                            //     {
                            //         condition: (dueDate) => {
                            //             const due = new Date(dueDate);
                            //             const today = new Date();
                            //             return due < today; // Highlight if overdue
                            //         },
                            //         class: 'danger-cell'
                            //     }
                            // ]
                        },
                        // {
                        //     header: 'Contact Number',
                        //     field: 'shippingAddress.contactNumber',
                        //     type: 'text',
                        //     align: 'center'
                        // },
                        // {
                        //     header: 'Location',
                        //     field: 'shippingAddress',
                        //     type: 'text',
                        //     align: 'left',
                        //     formatter: (address:any) =>
                        //         `${address.street}, ${address.city}, ${address.postalCode}`
                        // }
                    ],
                    footerText: '© 2025 Ramesh Traders'
                }
            );


            return successResponse('Payment due list retrieved', 200, {
                message: 'Payment due list retrieved',
                list: dueOrders,
                pdfUrl: pdfUrl
            });


            // return successResponse('Payment due list retrieved', 200, {
            //     message: 'Payment due list retrieved',
            //     list: dueOrders
            // });

        } catch (err: any) {
            console.error('Error in getPaymentDueList:', err);
            return createErrorResponse('Server Error', 500, err.message);
        }
    }

    async getSalesTargetAchievement(params: any) {
        try {
            const salemanId = new Types.ObjectId(params.userId);
            const { period, month, year } = params;

            // Step 1: Get the active sales target for that salesman and period
            const target = await SalesandTargets.findOne({
                salemanId,
                isActive: true,
                isDelete: false
            });

            if (!target) {
                return successResponse('No active sales target found', 200, {
                    message: 'Sales target status retrieved',
                    targetSalesAmount: 0,
                    actualSalesAmount: 0,
                    percentageAchieved: 0,
                    status: 'Not Achieved'
                });
            }

            // Step 2: Get date range based on filter parameters
            let startDate: Date;
            let endDate: Date;
            let monthName: string;
            const now = moment();

            if (month && year) {
                // Filter by specific month and year
                const monthMoment = moment(`${year}-${String(month).padStart(2, '0')}-01`);
                startDate = monthMoment.startOf('month').toDate();
                endDate = monthMoment.endOf('month').toDate();
                monthName = monthMoment.format('MMMM'); // Full month name (e.g., "July")
                // Alternative: monthMoment.format('MMM') for short name (e.g., "Jul")
            } else if (year) {
                // Filter by entire year
                startDate = moment(`${year}-01-01`).startOf('year').toDate();
                endDate = moment(`${year}-01-01`).endOf('year').toDate();
                monthName = 'Year'; // Or you can set it to null/undefined
            } else {
                // Default to current month if no filter specified
                startDate = now.clone().startOf('month').toDate();
                endDate = now.clone().endOf('month').toDate();
                monthName = now.format('MMMM');
            }

            const wholesalerMatch: any = {
                createdBy: salemanId,
                isActive: true,
                isDelete: false
            };
            const wholesalers = await WholesalerRetailsers.find(wholesalerMatch).select('_id');
            const wholesalerIds = wholesalers.map(w => w._id);

            // Step 3: Calculate total sales by the salesman in the date range
            const salesData = await OrderModel.aggregate([
                {
                    $match: {
                        placedBy: { $in: wholesalerIds },
                        isDelete: false,
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        actualSalesAmount: {
                            $sum: {
                                $add: [
                                    '$totalAmount'
                                ]
                            }
                        }
                    }
                }
            ]);

            const actualSalesAmount = salesData[0]?.actualSalesAmount ?? 0;
            const percentageAchieved = Math.round((actualSalesAmount / target.targetSalesAmount) * 100);

            // Step 4: Determine status    
            let status = 'Not Achieved';
            if (actualSalesAmount === target.targetSalesAmount) status = 'Achieved';
            else if (actualSalesAmount > target.targetSalesAmount) status = 'Exceeded';

            return successResponse('Sales target status retrieved', 200, {
                message: 'Sales target status retrieved',
                targetSalesAmount: target.targetSalesAmount,
                actualSalesAmount,
                percentageAchieved,
                status,
                period: {
                    month: month || now.month() + 1,
                    year: year || now.year(),
                    monthName: monthName
                }
            });

        } catch (err: any) {
            return createErrorResponse('Server error', 500, err.message);
        }
    }
    async createVisitTracker(input: CreateVisitTracker) {
        try {
            const result = await WholesalerVisitModel.insertOne({

                ...input,
                isActive: true,
                isDelete: false,
                createdBy: new Types.ObjectId(input.userId),
                modifiedBy: new Types.ObjectId(input.userId)
            })
            if (!result) {
                return createErrorResponse('Error creating', StatusCodes.BAD_REQUEST, 'Unable to create visit tracker');

            }
            return successResponse('Visit tracker created', StatusCodes.OK, {});
        } catch (e: any) {
            return createErrorResponse('Error creating', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async receivePayment(input: ReceivePaymentInput): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            if (!input?.items || input.items.length === 0) {
                return createErrorResponse('Invalid input', StatusCodes.BAD_REQUEST, 'No payment items provided');
            }

            const operations = input.items.map(async (val) => {
                // 1. Create payment record
                const newPayment = await PaymentReceiveModel.create({
                    customerId: input.customerId,
                    orderId: val.orderId,
                    dueAmount: val.dueAmount,
                    paidAmount: val.paidAmount,
                    paymentDate: input.paymentDate ?? '',
                    paymentMethod: input.paymentMethod,
                    paymentProof: input.paymentProof ?? '',
                    payInFull: (val.dueAmount === val.paidAmount ? true : false),
                    createdBy: input.createdBy,
                    modifiedBy: input.createdBy,
                    status: input.status ?? '',
                    createdFrom: input.status !== '' ? 'deliveryman' : 'lineman'
                });

                if (!newPayment) {
                    throw new Error(`Failed to create payment for order: ${val.orderId}`);
                }

                // 2. Update order's paymentProcessed flag
                await OrderModel.findByIdAndUpdate(val.orderId, {
                    paymentProcessed: 1
                });
            });

            await Promise.all(operations); // Wait for all

            return successResponse('Payment received successfully', StatusCodes.OK, {});
        } catch (err: any) {
            return createErrorResponse(
                'Error receiving payment',
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }

    async getPaymentModeSummaryForToday(userId: string) {
        try {
            const startOfToday = moment().startOf('day').toDate();
            const endOfToday = moment().endOf('day').toDate();

            const summary = await PaymentReceiveModel.aggregate([
                {
                    $match: {
                        createdBy: new Types.ObjectId(userId),
                        isDelete: false,
                        paymentDate: {
                            $gte: startOfToday,
                            $lte: endOfToday
                        }
                    }
                },
                {
                    $group: {
                        _id: '$paymentMethod',
                        transactionCount: { $sum: 1 },
                        totalValue: { $sum: '$paidAmount' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        paymentMethod: '$_id',
                        transactionCount: 1,
                        totalValue: 1
                    }
                }
            ]);

            // Optional: Add total row at the end
            const totalTransactions = summary.reduce((sum, item) => sum + item.transactionCount, 0);
            const totalValue = summary.reduce((sum, item) => sum + item.totalValue, 0);

            return successResponse('Payment received successfully', StatusCodes.OK, {
                summary,
                totalTransactions,
                totalValue
            });


        } catch (err: any) {
            return createErrorResponse(
                'Error creating',
                StatusCodes.BAD_REQUEST,
                'Error fetching received payments'
            );
        }
    }
    async settleCash(input: ReceiveCashSettlementInput) {
        try {

            const newSettlement = await CashSettlementModel.create({
                ...input,
                createdBy: input.settledBy,
                modifiedBy: input.settledBy
            });

            // Link unsettled cash payments for today
            const startOfToday = moment(input.settlementDate).startOf("day").toDate();
            const endOfToday = moment(input.settlementDate).endOf("day").toDate();

            await PaymentReceiveModel.updateMany(
                {
                    createdBy: input.settledBy,
                    paymentDate: { $gte: startOfToday, $lte: endOfToday },
                    // paymentMethod: "Cash",
                    settlementId: null
                },
                {
                    $set: { settlementId: newSettlement._id }
                }
            );

            return successResponse('Cash settlement completed', StatusCodes.OK, {});

        } catch (err: any) {
            return createErrorResponse(
                'Error creating',
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async getCashSettlementList(params: any) {
        try {
            const { status, startDate, filterType, endDate, userId, limit, page } = params;
            const skip = limit * page;
            const match: any = {
                isDelete: false
            };

            // Optional status filter
            if (status && status !== 'All') {
                match.status = status;
            }

            // Optional date range filter
            if (startDate && endDate) {
                match.settlementDate = {
                    $gte: moment(startDate, "YYYY-MM-DD").startOf("day").toDate(),
                    $lte: moment(endDate, "YYYY-MM-DD").endOf("day").toDate()
                };
            }
            // Date filter
            let dateFilter: any = {};
            const now = moment();
            if (filterType === 'today') {
                dateFilter = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
            } else if (filterType === 'yesterday') {
                dateFilter = {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lte: moment().subtract(1, 'day').endOf('day').toDate(),
                };
            } else if (filterType === 'thisWeek') {
                dateFilter = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
            } else if (filterType === 'thisMonth') {
                dateFilter = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
            }
            if (dateFilter && Object.keys(dateFilter).length > 0) {
                match.settlementDate = dateFilter;
            }
            // Optional user filter (settledBy)
            if (userId) {
                match.settledBy = userId;
            }
            const count = await CashSettlementModel.countDocuments(match)
            const settlements = await CashSettlementModel.find(match)
                .sort({ settlementDate: -1 }).skip(skip)
                .limit(limit)
                .lean();
            return Pagination(count, settlements, limit, page);

        } catch (err: any) {
            return createErrorResponse(
                'Error creating',
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async getAllUsers(
        params: UserlistSchema
    ): Promise<PaginationResult<User[]> | ErrorResponse> {
        try {
            const { page, limit, search, role } = params;

            // Base query for active, non-deleted users
            const query: any = {
                isActive: true,
                isDelete: false
            };

            // Add search filter if provided
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phoneNumber: { $regex: search, $options: "i" } },
                ];
            }

            // Add role filter if provided
            if (role) {
                query.role = role;
            }

            const pipeline: any[] = [
                { $match: query },
                {
                    $project: {
                        _id: 1,
                        isDelete: 1,
                        isActive: 1,
                        email: 1,
                        name: 1,
                        role: 1,
                        phoneNumber: 1,
                        createdBy: 1,
                        modifiedBy: 1,
                        userId: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                { $skip: (page) * limit },
                { $limit: limit }
            ];

            const userDtls = await AdminUsers.aggregate(pipeline);
            const count = await AdminUsers.countDocuments(query);

            return Pagination(count, userDtls, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                "err",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async getPaymentList(params: any) {
        try {
            const { status, startDate, endDate, dateFilter, limit, page, search, userId } = params;
            const skip = limit * page;

            const match: any = {
                isDelete: false
            };

            // Date Filter
            if (dateFilter === 'today') {
                match.paymentDate = {
                    $gte: moment().startOf("day").toDate(),
                    $lte: moment().endOf("day").toDate()
                };
            } else if (dateFilter === 'week') {
                match.paymentDate = {
                    $gte: moment().startOf("week").toDate(),
                    $lte: moment().endOf("week").toDate()
                };
            } else if (dateFilter === 'month') {
                match.paymentDate = {
                    $gte: moment().startOf("month").toDate(),
                    $lte: moment().endOf("month").toDate()
                };
            } else if (startDate && endDate) {
                match.paymentDate = {
                    $gte: moment(startDate, "YYYY-MM-DD").startOf("day").toDate(),
                    $lte: moment(endDate, "YYYY-MM-DD").endOf("day").toDate()
                };
            }

            // Status Filter
            if (status === 'Paid') {
                match.payInFull = true;
            } else if (status === 'Partially Paid') {
                match.payInFull = false;
            }

            const basePipeline: any[] = [
                { $match: match },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'orderId',
                        foreignField: '_id',
                        as: 'order'
                    }
                },
                { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }
            ];

            // Search Filter (case-insensitive)
            if (search && search.trim() !== '') {
                const regex = new RegExp(search.trim(), 'i');
                basePipeline.push({
                    $match: {
                        $or: [
                            { 'customer.name': regex },
                            { 'order.orderCode': regex },
                            { paymentMethod: regex },
                            { paymentDate: regex }
                        ]
                    }
                });
            }

            // Total count after all filters
            const countPipeline = [...basePipeline, { $count: 'total' }];
            const countResult = await PaymentReceiveModel.aggregate(countPipeline);
            const count = countResult[0]?.total ?? 0;

            // Pagination and Projection
            basePipeline.push(
                {
                    $project: {
                        paymentDate: 1,
                        paidAmount: 1,
                        paymentMethod: 1,
                        dueAmount: 1,
                        payInFull: 1,
                        customerName: '$customer.name',
                        orderNo: '$order.orderCode',
                        // status: {
                        //     $cond: {
                        //         if: { $eq: ['$payInFull', true] },
                        //         then: 'Paid',
                        //         else: 'Partially Paid'
                        //     }
                        // }
                        status: {
                            $cond: {
                                if: { $eq: ['$paidAmount', '$dueAmount'] },
                                then: 'Paid',
                                else: 'Partially Paid'
                            }
                        }

                    }
                },
                { $sort: { paymentDate: -1 } },
                { $skip: skip },
                { $limit: limit }
            );

            // const results = await PaymentReceiveModel.aggregate(basePipeline);
            // return Pagination(count, results, limit, page);
            const results = await PaymentReceiveModel.aggregate(basePipeline);

            // return Pagination(count, results, limit, page);
            const pdfUrl = await Uploads.generateDynamicPDF(
                results, // Your array of payment collection objects
                userId,  // The user ID
                {
                    title: 'Payment Collection Report',
                    logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                    columns: [
                        {
                            header: 'Customer Name',
                            field: 'customerName',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Order No',
                            field: 'orderNo',
                            type: 'text',
                            align: 'center'
                        },
                        {
                            header: 'Collected Amount (₹)',
                            field: 'paidAmount',
                            type: 'currency',
                            align: 'left'
                        },
                        {
                            header: 'Outstanding Amount (₹)',
                            field: 'dueAmount',
                            type: 'currency',
                            align: 'left',
                            // highlight: [
                            //     {
                            //         condition: (val) => val > 0,
                            //         class: 'danger-cell'
                            //     },
                            //     {
                            //         condition: (val) => val === 0,
                            //         class: 'success-cell'
                            //     }
                            // ]
                        },
                        {
                            header: 'Payment Mode',
                            field: 'paymentMethod',
                            type: 'text',
                            align: 'center'
                        },
                        {
                            header: 'Collection Date',
                            field: 'paymentDate',
                            type: 'date', // You'll need to add date formatting in your generateDynamicPDF method
                            align: 'center'
                        },
                        {
                            header: 'Status',
                            field: 'status',
                            type: 'text',
                            align: 'left'
                            // highlight: [
                            //     {
                            //         condition: (val) => val === 'Partially Paid',
                            //         class: 'warning-cell'
                            //     },
                            //     {
                            //         condition: (val) => val === 'Fully Paid',
                            //         class: 'success-cell'
                            //     }
                            // ]
                        }
                    ],
                    footerText: '© 2025 Ramesh Traders'
                }
            );

            console.log(pdfUrl, "Generated PDF URL");

            // 6. Return response with data and PDF link
            return successResponse('Payment Collection Report', 200, {
                data: results,
                pdfUrl: pdfUrl
            });


        } catch (err: any) {
            return createErrorResponse('Error retrieving payment list', 500, err.message);
        }
    }
    async getSalesTargetVsAchievementList(params: any) {
        try {
            const { month, year, userId, dateFilter, startDate, endDate } = params;

            const match: any = {
                salemanId: new Types.ObjectId(userId),
                isDelete: false,
                isActive: true,
                targetPeriod: 'Monthly'
            };

            // 🔁 Filter logic
            if (dateFilter === 'thisYear') {
                const start = moment().startOf('year').toDate();
                const end = moment().endOf('year').toDate();
                match.createdAt = { $gte: start, $lte: end };
            } else if (dateFilter === 'custom' && startDate && endDate) {
                match.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            } else if (month && year) {
                const start = moment(`${year}-${month}-01`).startOf('month').toDate();
                const end = moment(start).endOf('month').toDate();
                match.createdAt = { $gte: start, $lte: end };
            }

            const targets = await SalesandTargets.aggregate([
                { $match: match },
                {
                    $lookup: {
                        from: 'roots',
                        localField: 'salemanId',
                        foreignField: 'salesman',
                        as: 'routeInfo'
                    }
                },
                {
                    $unwind: {
                        path: '$routeInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        salesmanPincodes: {
                            $map: {
                                input: '$routeInfo.pincode',
                                as: 'pin',
                                in: '$$pin.code'
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        let: { pincodes: '$salesmanPincodes' },
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'useraddresses',
                                    localField: '_id',
                                    foreignField: 'userId',
                                    as: 'addresses'
                                }
                            },
                            {
                                $match: {
                                    $expr: {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: '$addresses',
                                                        as: 'addr',
                                                        cond: { $in: [{ $toString: '$$addr.postalCode' }, '$$pincodes'] }

                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            },
                            {
                                $project: { _id: 1 }
                            }
                        ],
                        as: 'linkedWholesalers'
                    }
                },

                {
                    $addFields: {
                        wholesalerIds: {
                            $map: {
                                input: '$linkedWholesalers',
                                as: 'wh',
                                in: '$$wh._id'
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        let: {
                            wholesalerIds: '$wholesalerIds',
                            targetCreatedAt: '$createdAt'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $in: ['$placedBy', '$$wholesalerIds'] },
                                            {
                                                $and: [
                                                    {
                                                        $gte: [
                                                            '$createdAt',
                                                            { $dateTrunc: { date: '$$targetCreatedAt', unit: 'month' } }
                                                        ]
                                                    },
                                                    {
                                                        $lt: [
                                                            '$createdAt',
                                                            {
                                                                $dateAdd: {
                                                                    startDate: {
                                                                        $dateTrunc: { date: '$$targetCreatedAt', unit: 'month' }
                                                                    },
                                                                    unit: 'month',
                                                                    amount: 1
                                                                }
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalAchievedAmount: {
                                        $sum: {
                                            $add: [
                                                '$totalAmount',
                                                { $ifNull: ['$deliveryCharge', 0] }
                                            ]
                                        }
                                    },
                                    totalOrders: { $sum: 1 },
                                    uniqueClients: { $addToSet: '$placedBy' }
                                }
                            },
                            {
                                $project: {
                                    totalAchievedAmount: 1,
                                    totalOrders: 1,
                                    totalClients: { $size: '$uniqueClients' }
                                }
                            }
                        ],
                        as: 'achievement'
                    }
                },
                {
                    $unwind: {
                        path: '$achievement',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'salemanId',
                        foreignField: '_id',
                        as: 'salesman'
                    }
                },
                { $unwind: '$salesman' },
                {
                    $addFields: {
                        monthYear: {
                            $dateToString: { format: '%b %Y', date: '$createdAt' }
                        }
                    }
                },
                {
                    $project: {
                        salesmanName: '$salesman.fullName',
                        targetAssigned: '$targetSalesAmount',
                        month: '$monthYear',
                        achieved: { $ifNull: ['$achievement.totalAchievedAmount', 0] },
                        ordersTaken: { $ifNull: ['$achievement.totalOrders', 0] },
                        clientsOnboarded: { $ifNull: ['$achievement.totalClients', 0] },
                        achievementPercent: {
                            $cond: [
                                { $eq: ['$targetSalesAmount', 0] },
                                0,
                                {
                                    $round: [
                                        {
                                            $multiply: [
                                                { $divide: [{ $ifNull: ['$achievement.totalAchievedAmount', 0] }, '$targetSalesAmount'] },
                                                100
                                            ]
                                        },
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                },
                { $sort: { month: -1 } }
            ]);
            // 4. Sort by month descending
            targets.sort((a, b) => moment(b.month, 'MMM YYYY').valueOf() - moment(a.month, 'MMM YYYY').valueOf());

            // return successResponse('Sales Target vs Achievement List', 200, results);
            // 5. Generate PDF and get URL

            const pdfUrl = await Uploads.generateDynamicPDF(
                targets, // Your array of result objects
                userId,  // The user ID
                {
                    title: 'Sales Target vs Achievement Report',
                    logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                    columns: [
                        {
                            header: 'Month',
                            field: 'month',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Target (₹)',
                            field: 'targetAssigned',
                            type: 'currency',
                            align: 'left'
                        },
                        {
                            header: 'Achieved (₹)',
                            field: 'achieved',
                            type: 'currency',
                            align: 'left'
                        },
                        {
                            header: 'Achievement %',
                            field: 'achievementPercent',
                            type: 'percentage',
                            align: 'left'
                            // highlight: [
                            //     {
                            //         condition: (val) => val >= 100,
                            //         class: 'success-cell'
                            //     },
                            //     {
                            //         condition: (val) => val >= 75,
                            //         class: 'warning-cell'
                            //     },
                            //     {
                            //         condition: (val) => val < 75,
                            //         class: 'danger-cell'
                            //     }
                            // ]
                        },
                        {
                            header: 'Orders Taken',
                            field: 'ordersTaken',
                            type: 'number',
                            align: 'center'
                        },
                        {
                            header: 'Active Clients',
                            field: 'activeClients',
                            type: 'number',
                            align: 'center'
                        },
                        {
                            header: 'Clients Onboarded',
                            field: 'clientsOnboarded',
                            type: 'number',
                            align: 'center'
                        }
                    ],
                    footerText: '© 2025 Ramesh Traders'
                }
            );

            console.log(pdfUrl, "Generated PDF URL");

            // 6. Return response with data and PDF link
            return successResponse('Sales Target vs Achievement List', 200, {
                data: targets,
                pdfUrl: pdfUrl
            });
            // return successResponse('Sales Target vs Achievement List', 200, targets);
        } catch (err: any) {
            return createErrorResponse('Failed to get list', 500, err.message);
        }
    }
    async getSalesConversionReport(params: any) {
        try {
            const { userId, filterType, fromDate, toDate } = params;

            const match: any = {
                isDelete: false,
                isActive: true,
                createdBy: new Types.ObjectId(userId)
            };

            // Apply Date Filter
            if (filterType === 'ThisYear') {
                const start = moment().startOf('year').toDate();
                const end = moment().endOf('year').toDate();
                match.createdAt = { $gte: start, $lte: end };
            } else if (filterType === 'Custom' && fromDate && toDate) {
                match.createdAt = {
                    $gte: new Date(fromDate),
                    $lte: new Date(toDate)
                };
            }

            const visits = await WholesalerVisitModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        totalCustomersVisited: { $addToSet: '$wholeSalerId' }
                    }
                },
                {
                    $project: {
                        month: '$_id.month',
                        year: '$_id.year',
                        totalCustomersVisited: { $size: '$totalCustomersVisited' }
                    }
                },
                {
                    $addFields: {
                        startOfMonth: {
                            $dateFromParts: { year: '$year', month: '$month', day: 1 }
                        },
                        endOfMonth: {
                            $dateAdd: {
                                startDate: {
                                    $dateFromParts: { year: '$year', month: '$month', day: 1 }
                                },
                                unit: 'month',
                                amount: 1
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        let: {
                            start: '$startOfMonth',
                            end: '$endOfMonth',
                            userId: new Types.ObjectId(userId)
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $gte: ['$createdAt', '$$start'] },
                                            { $lt: ['$createdAt', '$$end'] },
                                            { $eq: ['$createdBy', '$$userId'] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'orders'
                    }
                },
                {
                    $addFields: {
                        ordersPlaced: { $size: '$orders' },
                        conversionRate: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: [{ $ifNull: ['$totalCustomersVisited', 0] }, 0] },
                                        { $eq: ['$totalCustomersVisited', null] }
                                    ]
                                },
                                0,
                                {
                                    $round: [
                                        {
                                            $multiply: [
                                                {
                                                    $divide: [
                                                        { $ifNull: ['$ordersPlaced', 0] },
                                                        { $ifNull: ['$totalCustomersVisited', 1] }
                                                    ]
                                                },
                                                100
                                            ]
                                        },
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        monthLabel: {
                            $concat: [
                                {
                                    $arrayElemAt: [
                                        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                                        { $subtract: ['$month', 1] } // Adjust index
                                    ]
                                },
                                ' ',
                                { $toString: '$year' }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: '$monthLabel',
                        totalCustomersVisited: 1,
                        ordersPlaced: 1,
                        conversionRate: 1
                    }
                },
                {
                    $sort: {
                        year: 1,
                        month: 1
                    }
                }
            ]);

            const pdfUrl = await Uploads.generateDynamicPDF(
                visits, // Your array of visitor data objects
                userId,  // The user ID
                {
                    title: 'Sales Visit Conversion Report',
                    logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                    columns: [
                        {
                            header: 'Month',
                            field: 'month',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Total Customers Visited',
                            field: 'totalCustomersVisited',
                            type: 'number',
                            align: 'center'
                        },
                        {
                            header: 'Orders Placed',
                            field: 'ordersPlaced',
                            type: 'number',
                            align: 'center'
                        },
                        {
                            header: 'Conversion Rate (%)',
                            field: 'conversionRate',
                            type: 'percentage',
                            align: 'left'
                            // highlight: [
                            //     {
                            //         condition: (val) => val >= 50,
                            //         class: 'success-cell'
                            //     },
                            //     {
                            //         condition: (val) => val >= 30,
                            //         class: 'warning-cell'
                            //     },
                            //     {
                            //         condition: (val) => val < 30,
                            //         class: 'danger-cell'
                            //     }
                            // ]
                        }
                    ],
                    footerText: '© 2025 Ramesh Traders'
                }
            );

            console.log(pdfUrl, "Generated PDF URL");

            // 6. Return response with data and PDF link
            return successResponse('Sales Conversion Report', 200, {
                data: visits,
                pdfUrl: pdfUrl
            });
            // return successResponse('Sales Conversion Report', 200, visits);
        } catch (err: any) {
            return createErrorResponse('Failed to generate report', 500, err.message);
        }
    }
    async getCustomerActivity(params: any) {
        const { userId, filterType, startDate, endDate, month, year } = params;

        const route = await RootModel.findOne({
            salesman: userId,
            isActive: true,
            isDelete: false
        });

        const pincodes = route?.pincode.map(e => e.code) || [];

        // Define date range
        let dateFilter: any = {};

        if (filterType === 'last30Days') {
            dateFilter = {
                $gte: moment().subtract(30, 'days').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filterType === 'last60Days') {
            dateFilter = {
                $gte: moment().subtract(60, 'days').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filterType === 'last90Days') {
            dateFilter = {
                $gte: moment().subtract(90, 'days').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filterType === 'custom' && startDate && endDate) {
            dateFilter = {
                $gte: moment(startDate).startOf('day').toDate(),
                $lte: moment(endDate).endOf('day').toDate()
            };
        } else if (month && year) {
            // Handle month-year filter
            // Convert month name to number if needed
            let monthNumber = month;
            if (isNaN(month)) {
                // If month is a name like "July", convert it to number
                monthNumber = moment().month(month).month() + 1; // moment months are 0-indexed
            }

            const monthStr = String(monthNumber).padStart(2, '0');
            dateFilter = {
                $gte: moment(`${year}-${monthStr}-01`).startOf('month').toDate(),
                $lte: moment(`${year}-${monthStr}-01`).endOf('month').toDate()
            };
        }

        // Step 3: Get wholesalers in those pincodes
        const wholesalersInPincode = await WholesalerRetailsers.aggregate([
            {
                $match: {
                    'address.postalCode': { $in: pincodes }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    isActive: { $first: '$isActive' }
                }
            }
        ]);

        // Build match conditions for the lookup pipeline
        let orderMatchConditions: any[] = [
            { $eq: ['$placedBy', '$$customerId'] },
            { $in: ['$shippingAddress.postalCode', pincodes] }
        ];

        // Add date filter if dateFilter is defined
        if (dateFilter && dateFilter.$gte && dateFilter.$lte) {
            orderMatchConditions.push(
                { $gte: ['$createdAt', dateFilter.$gte] },
                { $lte: ['$createdAt', dateFilter.$lte] }
            );
        }

        const customerActivity = await WholesalerRetailsers.aggregate([
            {
                $match: {
                    _id: { $in: wholesalersInPincode.map((e) => new Types.ObjectId(e._id)) ?? [] },
                    isDelete: false,
                    isActive: true
                }
            },
            {
                $lookup: {
                    from: 'orders',
                    let: { customerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: orderMatchConditions
                                }
                            }
                        }
                    ],
                    as: 'orders'
                }
            },
            {
                $match: {
                    orders: { $ne: [], $exists: true }
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: '$orders' },
                    totalSalesAmount: {
                        $sum: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: {
                                    $add: [
                                        '$$order.totalAmount',
                                        { $ifNull: ['$$order.deliveryCharge', 0] }
                                    ]
                                }
                            }
                        }
                    },
                    pendingAmount: {
                        $sum: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: {
                                    $subtract: [
                                        { $add: ['$$order.totalAmount', { $ifNull: ['$$order.deliveryCharge', 0] }] },
                                        { $ifNull: ['$$order.amountPaid', 0] }
                                    ]
                                }
                            }
                        }
                    },
                    lastOrderDate: {
                        $max: '$orders.createdAt'
                    }
                }
            },
            { $sort: { customerName: 1 } },
        ]);

        // Format dates for PDF
        const formattedCustomerActivity = customerActivity.map(customer => ({
            ...customer,
            lastOrderDate: customer.lastOrderDate ? moment(customer.lastOrderDate).format('DD/MM/YYYY') : 'No Orders',
            totalSalesAmount: customer.totalSalesAmount ? customer.totalSalesAmount.toFixed(2) : '0.00',
            pendingAmount: customer.pendingAmount ? customer.pendingAmount.toFixed(2) : '0.00'
        }));

        const pdfUrl = await Uploads.generateDynamicPDF(
            formattedCustomerActivity,
            userId,
            {
                title: 'Customer Activity Report',
                logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                columns: [
                    {
                        header: 'Customer Name',
                        field: 'name',
                        type: 'text',
                        align: 'left',
                    },
                    {
                        header: 'Company Name',
                        field: 'companyName',
                        type: 'text',
                        align: 'left',
                    },
                    {
                        header: 'Last Order Date',
                        field: 'lastOrderDate',
                        type: 'text',  // Changed to text since we're formatting it
                        align: 'left'
                    },
                    {
                        header: 'Total Orders Placed',
                        field: 'totalOrders',
                        type: 'number',
                        align: 'left'
                    },
                    {
                        header: 'Total Sales (₹)',
                        field: 'totalSalesAmount',
                        type: 'text',  // Changed to text since we're formatting it
                        align: 'left',
                    },
                    {
                        header: 'Outstanding Balance (₹)',
                        field: 'pendingAmount',
                        type: 'text',  // Changed to text since we're formatting it
                        align: 'left',
                    }
                ],
                footerText: '© 2025 Ramesh Traders'
            }
        );

        return successResponse('Customer Activity Report', 200, {
            data: customerActivity,
            pdfUrl: pdfUrl
        });
    }

    async getOrderSummary(params: any) {
        const { userId, filterType, fromDate, toDate } = params;

        const user = await AdminUsers.findOne({ _id: new Types.ObjectId(userId), isDelete: false, isActive: true });
        if (!user) return createErrorResponse('Invalid user', 400);

        const route = await RootModel.findOne({ salesman: userId, isDelete: false, isActive: true });
        const pincodes = route?.pincode.map((p) => p.code) ?? [];

        // Date filter
        let dateFilter: any = {};
        const now = moment();

        if (filterType === 'today') {
            dateFilter = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
        } else if (filterType === 'yesterday') {
            dateFilter = {
                $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                $lte: moment().subtract(1, 'day').endOf('day').toDate(),
            };
        } else if (filterType === 'thisWeek') {
            dateFilter = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
        } else if (filterType === 'thisMonth') {
            dateFilter = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
        } else if (filterType === 'Last30Days') {
            dateFilter = {
                $gte: moment().subtract(30, 'days').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filterType === 'Last60Days') {
            dateFilter = {
                $gte: moment().subtract(60, 'days').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filterType === 'Last90Days') {
            dateFilter = {
                $gte: moment().subtract(90, 'days').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        }

        else if (filterType === 'Custom' && fromDate && toDate) {
            dateFilter = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        }

        const orderList = await OrderModel.aggregate([
            {
                $match: {
                    isDelete: false,
                    isActive: true,
                    createdAt: dateFilter,
                    'shippingAddress.postalCode': { $in: pincodes },
                },
            },
            {
                $lookup: {
                    from: 'wholesalerretailers',
                    localField: 'placedBy',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: '$customer' },
            {
                $project: {
                    _id: 0,
                    customerName: '$customer.name',
                    orderNumber: { $concat: ['#', { $toString: '$orderCode' }] },
                    date: { $dateToString: { format: '%d %b', date: '$createdAt' } },
                    totalAmount: '$totalAmount',
                    deliveryCharge: { $ifNull: ['$deliveryCharge', 0] },
                    totalAmounts: {
                        $add: [
                            '$totalAmount',
                            { $ifNull: ['$deliveryCharge', 0] }
                        ]
                    },
                    paymentMode: '$paymentMode',
                    orderStatus: '$status'
                },
            },
            { $sort: { createdAt: -1 } },

        ]);
        // return successResponse('Order Summary', 200, orderList);
        const pdfUrl = await Uploads.generateDynamicPDF(
            orderList, // Your array of order data objects
            userId,  // The user ID
            {
                title: 'Order Details Report',
                logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                columns: [
                    {
                        header: 'Date',
                        field: 'date',
                        type: 'text',
                        align: 'left'
                    },
                    {
                        header: 'Customer Name',
                        field: 'customerName',
                        type: 'text',
                        align: 'left'
                    },
                    {
                        header: 'Order Number',
                        field: 'orderNumber',
                        type: 'text',
                        align: 'center'
                    },
                    {
                        header: 'Total Amount (₹)',
                        field: 'totalAmounts',
                        type: 'currency',
                        align: 'left'
                    },
                    {
                        header: 'Payment Mode',
                        field: 'paymentMode',
                        type: 'text',
                        align: 'left'
                        // highlight: [
                        //     {
                        //         condition: (val) => val.toUpperCase() === 'CREDIT',
                        //         class: 'warning-cell'
                        //     },
                        //     {
                        //         condition: (val) => val.toUpperCase() === 'UPI',
                        //         class: 'success-cell'
                        //     }
                        // ]
                    },
                    {
                        header: 'Order Status',
                        field: 'orderStatus',
                        type: 'text',
                        align: 'left'
                        // highlight: [
                        //     {
                        //         condition: (val) => val === 'delivered',
                        //         class: 'success-cell'
                        //     },
                        //     {
                        //         condition: (val) => val === 'approved',
                        //         class: 'info-cell' // You can define this in your CSS
                        //     },
                        //     {
                        //         condition: (val) => val === 'cancelled',
                        //         class: 'danger-cell'
                        //     }
                        // ]
                    }
                ],
                footerText: '© 2025 Ramesh Traders'
            }
        );
        // 6. Return response with data and PDF link
        return successResponse('Order Summary', 200, {
            data: orderList,
            pdfUrl: pdfUrl
        });
        // return successResponse('Order Summary', 200, orderList);
    }


    async inactiveCustomer(params: any) {
        try {
            const { userId, filterType, fromDate, toDate } = params;

            const user = await AdminUsers.findOne({ _id: new Types.ObjectId(userId), isDelete: false, isActive: true });
            if (!user) return createErrorResponse('Invalid user', 400);

            const route = await RootModel.findOne({ salesman: userId, isDelete: false, isActive: true });
            const pincodes = route?.pincode.map((p) => p.code) ?? [];

            // Optional date filter for reporting (if needed for UI)
            let dateFilter: any = {};
            const now = moment();
            let minDaysInactive = 30; // default

            if (filterType === 'today') {
                dateFilter = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
            } else if (filterType === 'yesterday') {
                dateFilter = {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lte: moment().subtract(1, 'day').endOf('day').toDate(),
                };
            } else if (filterType === 'thisWeek') {
                dateFilter = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
            } else if (filterType === 'thisMonth') {
                dateFilter = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
            } else if (filterType === 'last30Days') {
                dateFilter = {
                    $gte: moment().subtract(30, 'days').startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate()
                };
            } else if (filterType === 'last60Days') {
                dateFilter = {
                    $gte: moment().subtract(60, 'days').startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate()
                };
            } else if (filterType === 'last90Days') {
                dateFilter = {
                    $gte: moment().subtract(90, 'days').startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate()
                };
            } else if (filterType === 'above90Days') {
                minDaysInactive = 90;
            } else if (filterType === 'custom' && fromDate && toDate) {
                dateFilter = { $gte: new Date(fromDate), $lte: new Date(toDate) };
            }


            const wholesalersInPincode = await WholesalerRetailsers.aggregate([

                {
                    $match: {
                        'address.postalCode': { $in: pincodes }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        isActive: { $first: '$isActive' }
                    }
                }
            ]);

            const list = await WholesalerRetailsers.aggregate([
                {
                    $match: {
                        _id: { $in: wholesalersInPincode.map(e => new Types.ObjectId(e._id)) },
                        isDelete: false,
                        isActive: true
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        let: { customerId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$placedBy', '$$customerId'] },
                                            { $in: ['$shippingAddress.postalCode', pincodes] }
                                        ]
                                    }
                                }
                            },
                            { $sort: { createdAt: -1 } },
                            { $limit: 1 }
                        ],
                        as: 'lastOrder'
                    }
                },
                { $unwind: { path: '$lastOrder', preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        daysSinceLastOrder: {
                            $cond: [
                                { $ifNull: ['$lastOrder.createdAt', false] },
                                {
                                    $divide: [
                                        { $subtract: [new Date(), '$lastOrder.createdAt'] },
                                        1000 * 60 * 60 * 24
                                    ]
                                },
                                null
                            ]
                        },
                        lastOrderDate: '$lastOrder.createdAt'
                    }
                },
                {
                    $match: {
                        $or: [
                            { daysSinceLastOrder: { $gt: minDaysInactive } },
                            { daysSinceLastOrder: null }
                        ]
                    }
                },
                {
                    $project: {
                        name: 1,
                        lastOrderDate: { $dateToString: { format: '%d %b %Y', date: '$lastOrderDate' } },
                        daysSinceLastOrder: { $round: ['$daysSinceLastOrder', 0] }
                    }
                }
            ]);

            // return successResponse('Inactive customer list', 200, list);
            const pdfUrl = await Uploads.generateDynamicPDF(
                list, // Your array of inactive customer data
                userId,  // The user ID
                {
                    title: 'Inactive Customers Report',
                    logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                    columns: [
                        {
                            header: 'Customer Name',
                            field: 'name',  // Matches your data field
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Company Name',
                            field: 'companyName',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Phone',
                            field: 'phone',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Last Order Date',
                            field: 'lastOrderDate',
                            type: 'date',  // Will handle null values gracefully
                            align: 'center'
                        },
                        {
                            header: 'Days Inactive',
                            field: 'daysSinceLastOrder',
                            type: 'number',
                            align: 'left'
                        }
                    ],
                    footerText: '© 2025 Ramesh Traders'
                }
            );

            // 6. Return response with data and PDF link
            return successResponse('Inactive customer list', 200, {
                data: list,
                pdfUrl: pdfUrl
            });

        } catch (err: any) {
            return createErrorResponse('Failed to generate report', 500, err.message);
        }
    }
    // async getVisitTrackerReport(params: any) {
    //     try {
    //         const { userId, filterType, fromDate, toDate } = params;

    //         // Validate user
    //         const user = await AdminUsers.findOne({
    //             _id: new ObjectId(userId),
    //             isDelete: false,
    //             isActive: true
    //         });
    //         if (!user) return createErrorResponse('Invalid user', 400);

    //         // Build date filter
    //         let dateFilter: any = {};
    //         const now = moment();

    //         if (filterType === 'today') {
    //             dateFilter = {
    //                 $gte: now.startOf('day').toDate(),
    //                 $lte: now.endOf('day').toDate()
    //             };
    //         } else if (filterType === 'ThisWeek') {
    //             dateFilter = {
    //                 $gte: now.startOf('week').toDate(),
    //                 $lte: now.endOf('week').toDate()
    //             };
    //         } else if (filterType === 'ThisMonth') {
    //             dateFilter = {
    //                 $gte: now.startOf('month').toDate(),
    //                 $lte: now.endOf('month').toDate()
    //             };
    //         } else if (filterType === 'Custom' && fromDate && toDate) {
    //             dateFilter = {
    //                 $gte: new Date(fromDate),
    //                 $lte: new Date(toDate)
    //             };
    //         }

    //         // Build MongoDB query safely
    //         const query: any = {
    //             createdBy: new ObjectId(userId)
    //         };
    //         if (Object.keys(dateFilter).length > 0) {
    //             query.createdAt = dateFilter;
    //         }

    //         // Fetch Visit Logs
    //         const visits = await WholesalerVisitModel.aggregate([
    //             {
    //                 $match: query
    //             },
    //             {
    //                 $lookup: {
    //                     from: 'wholesalerretailers',
    //                     localField: 'wholeSalerId',
    //                     foreignField: '_id',
    //                     as: 'customer',
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     wholeSalerId: 1,
    //                     visitPurpose: 1,
    //                     followUpDate: {
    //                         $cond: {
    //                             if: { $eq: ['$followUpDate', null] },
    //                             then: '',
    //                             else: {
    //                                 $dateToString: { format: '%d %b %Y', date: '$followUpDate' }
    //                             }
    //                         }
    //                     },
    //                     visitNotes: 1,
    //                     status: 1,
    //                     createdAt: 1,
    //                     updatedAt: 1,
    //                     customerName: { $arrayElemAt: ['$customer.name', 0] },

    //                 }
    //             }
    //         ]);
    //         // return successResponse('Visit tracker report', 200, visits);
    //         const pdfUrl = await Uploads.generateDynamicPDF(
    //             visits, // Your array of visit data objects
    //             userId,  // The user ID
    //             {
    //                 title: 'Visit Tracker Report',
    //                 logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
    //                 columns: [
    //                     {
    //                         header: 'Date',
    //                         field: 'createdAt',
    //                         type: 'date',
    //                         align: 'left',

    //                     },
    //                     {
    //                         header: 'Customer Name',
    //                         field: 'customerName',
    //                         type: 'text',
    //                         align: 'left',
    //                     },
    //                     {
    //                         header: 'Visit Purpose',
    //                         field: 'visitPurpose',
    //                         type: 'text',
    //                         align: 'left'
    //                     },
    //                     {
    //                         header: 'Status',
    //                         field: 'status',
    //                         type: 'text',
    //                         align: 'left'

    //                     },
    //                     {
    //                         header: 'Start Time',
    //                         field: 'startTime',
    //                         type: 'time',
    //                         align: 'left'
    //                     },
    //                     {
    //                         header: 'End Time',
    //                         field: 'updatedAt',
    //                         type: 'time',
    //                         align: 'left'
    //                     },
    //                     {
    //                         header: 'Remarks',
    //                         field: 'visitNotes',
    //                         type: 'text',
    //                         align: 'left',
    //                     }
    //                 ],
    //                 footerText: '© 2025 Ramesh Traders'
    //             }
    //         );

    //         // 6. Return response with data and PDF link
    //         return successResponse('Visit tracker report', 200, {
    //             data: visits,
    //             pdfUrl: pdfUrl
    //         });
    //         // return successResponse('Visit tracker report', 200, visits);

    //     } catch (err: any) {
    //         return createErrorResponse('Failed to fetch visit report', 500, err.message);
    //     }
    // }
    async getVisitTrackerReport(params: any) {
        try {
            const { userId, filterType, fromDate, toDate } = params;

            /* ---------------- USER VALIDATION ---------------- */
            const user = await AdminUsers.findOne({
                _id: new Types.ObjectId(userId),
                isDelete: false,
                isActive: true
            });

            if (!user) {
                return createErrorResponse('Invalid user', 400);
            }

            /* ---------------- DATE FILTER ---------------- */
            let dateFilter: any = {};
            const now = moment();

            switch (filterType) {
                case 'today':
                    dateFilter = {
                        $gte: now.startOf('day').toDate(),
                        $lte: now.endOf('day').toDate()
                    };
                    break;

                case 'thisWeek':
                    dateFilter = {
                        $gte: now.startOf('week').toDate(),
                        $lte: now.endOf('week').toDate()
                    };
                    break;

                case 'thisMonth':
                    dateFilter = {
                        $gte: now.startOf('month').toDate(),
                        $lte: now.endOf('month').toDate()
                    };
                    break;

                case 'custom':
                    if (fromDate && toDate) {
                        dateFilter = {
                            $gte: moment(fromDate).startOf('day').toDate(),
                            $lte: moment(toDate).endOf('day').toDate()
                        };
                    }
                    break;
            }

            /* ---------------- BASE QUERY ---------------- */
            const query: any = {
                createdBy: new Types.ObjectId(userId)
            };

            if (Object.keys(dateFilter).length > 0) {
                query.createdAt = dateFilter;
            }

            /* ---------------- AGGREGATION ---------------- */
            const visits = await WholesalerVisitModel.aggregate([
                { $match: query },

                {
                    $lookup: {
                        from: 'wholesalerretailers',
                        localField: 'wholeSalerId',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },

                {
                    $addFields: {
                        customerName: { $arrayElemAt: ['$customer.name', 0] }
                    }
                },

                {
                    $project: {
                        wholeSalerId: 1,
                        visitPurpose: 1,
                        visitNotes: 1,
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        startTime: 1,
                        endTime: 1,
                        customerName: 1,

                        followUpDate: {
                            $cond: [
                                { $eq: ['$followUpDate', null] },
                                '',
                                {
                                    $dateToString: {
                                        format: '%d %b %Y',
                                        date: '$followUpDate'
                                    }
                                }
                            ]
                        }
                    }
                },

                { $sort: { createdAt: -1 } }
            ]);

            /* ---------------- PDF GENERATION ---------------- */
            const pdfUrl = await Uploads.generateDynamicPDF(
                visits,
                userId,
                {
                    title: 'Visit Tracker Report',
                    logoUrl: 'https://nalsuvai.com/assets/imgs/theme/logo.png',
                    columns: [
                        {
                            header: 'Date',
                            field: 'createdAt',
                            type: 'date',
                            align: 'left'
                        },
                        {
                            header: 'Customer Name',
                            field: 'customerName',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Visit Purpose',
                            field: 'visitPurpose',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Status',
                            field: 'status',
                            type: 'text',
                            align: 'left'
                        },
                        {
                            header: 'Start Time',
                            field: 'startTime',
                            type: 'time',
                            align: 'left'
                        },
                        {
                            header: 'End Time',
                            field: 'endTime',
                            type: 'time',
                            align: 'left'
                        },
                        {
                            header: 'Remarks',
                            field: 'visitNotes',
                            type: 'text',
                            align: 'left'
                        }
                    ],
                    footerText: '© 2025 Ramesh Traders'
                }
            );

            /* ---------------- RESPONSE ---------------- */
            return successResponse('Visit tracker report', 200, {
                data: visits,
                pdfUrl
            });

        } catch (err: any) {
            return createErrorResponse('Failed to fetch visit report', 500, err.message);
        }
    }

    async getShopTypeList(params: RootListParams): Promise<PaginationResult<ShopTypeDocumentResponse[]> | ErrorResponse> {
        try {
            const { page, limit, search } = params;
            const pipeLine = [];

            // Add pincode filter if pincode parameter is provided
            const matchFilter: any = {
                isActive: true,
                isDelete: false
            };
            if (search) {
                matchFilter.name = { $regex: search, $options: "i" };
            }
            pipeLine.push(
                {
                    $match: matchFilter
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'modifiedBy',
                        foreignField: '_id',
                        as: 'modifiedBy'
                    }
                },

                {
                    $project: {
                        _id: 1,
                        name: 1,
                        isDelete: 1,
                        isActive: 1,
                        createdByName: { $arrayElemAt: ['$createdBy.name', 0] },
                        modifiedByName: { $arrayElemAt: ['$modifiedBy.name', 0] },
                        createdAt: 1,
                        updatedAt: 1,
                    }
                }
            );

            if (limit > 0) {
                pipeLine.push(
                    { $skip: page * limit },
                    { $limit: limit }
                );
            }

            const [result, count] = await Promise.all([
                ShopTypes.aggregate(pipeLine),
                limit > 0 ? ShopTypes.countDocuments(matchFilter) : 0
            ]);
            const finalResult = await Promise.all(result.map(async (val) => {

                const varaint = val.variants?.map((v: any) => {
                    const unit = val.units.find((e: any) => e._id.toString() === v.unitId.toString())
                    return {
                        ...v,
                        unitName: unit.name ?? ''
                    }
                })
                delete val.units
                return {
                    ...val,
                    variants: varaint
                }
            }))
            return Pagination(count, finalResult, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                "Error in list route",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export const LineManRepository = (db: any) => new LinemanRepository(db);
