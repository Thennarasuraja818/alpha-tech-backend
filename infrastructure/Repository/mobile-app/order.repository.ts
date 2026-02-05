import { Types } from 'mongoose';
import { OrderDocument, OrderModel } from '../../../app/model/order';
import {
    ApiResponse, ErrorResponse, SuccessMessage
} from '../../../api/response/commonResponse';
import { CreateOrderInput, UpdateOrderInput } from '../../../api/Request/order';
import { StatusCodes } from 'http-status-codes';
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { OrderDomainRepository } from '../../../domain/mobile-app/orderDomain';
import { successResponse } from '../../../utils/common/commonResponse';
import { createErrorResponse } from '../../../utils/common/errors';
import { ProductModel } from '../../../app/model/product';
import Attribute from '../../../app/model/attribute';
import Category from '../../../app/model/category';
import { ReviewModel } from '../../../app/model/review';
import { CartModel } from '../../../app/model/cart';
import { ProductHelper } from '../../../utils/utilsFunctions/product.helper';
import { ProductDocument } from '../../../api/response/product.response';
import Users from '../../../app/model/user';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
import { WholeSalerCreditModel } from '../../../app/model/wholesaler.credit';
import { RootModel } from '../../../app/model/root';
import { RootDocumentResponse } from '../../../api/response/root.response';
import { RootListParams } from '../../../domain/admin/root.Domain';

import moment from 'moment';
import OfferModel from '../../../app/model/Offer';
import AdminUsers from '../../../app/model/admin.user';
import { SalesandTargets } from '../../../app/model/salesandtargets';
export class OrderRepository implements OrderDomainRepository {
    constructor(private db: any) { }
    async topSellingProduct(params: { type: string }): Promise<ApiResponse<ProductDocument[]> | ErrorResponse> {
        try {
            const { type } = params;

            const productSales = await ProductModel.aggregate([
                { $match: { isDelete: false } },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'items.productId',
                        as: 'orders'
                    }
                },
                { $unwind: '$orders' },
                {
                    $match: {
                        'orders.isDelete': false,
                        'orders.placedByModel': type === 'customer' ? 'User' : 'Wholesaler'
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { orderCount: -1 } },
                { $limit: 15 }
            ]);

            // const topProductIds = productSales.map(p => new ObjectId(p._id));

            // const topProducts = await ProductModel.find({ _id: { $in: topProductIds } }).sort({ _id: 1 });

            const result = await Promise.all(productSales.map(async (products) => {
                let ratValue = 0;
                const product = await ProductModel.findOne({ _id: new Types.ObjectId(products._id) });
                if (!product) return;

                const review = await ReviewModel.find({
                    productId: new Types.ObjectId(product._id),
                    isActive: true,
                    isDelete: false
                });

                if (review.length > 0) {
                    for (const val of review) {
                        ratValue += val.rating;
                    }
                }
                const offers = await OfferModel.findOne({ 'productId.id': new Types.ObjectId(product._id) });

                const customerAttrIds = (product.customerAttribute?.attributeId || []).filter(Boolean).map(id => id.toString());
                const wholesalerAttrIds = (product.wholesalerAttribute?.attributeId || []).filter(Boolean).map(id => id.toString());

                const [customerAttributes, wholesalerAttributes, category] = await Promise.all([
                    Attribute.find({ _id: { $in: customerAttrIds } }).lean(),
                    Attribute.find({ _id: { $in: wholesalerAttrIds } }).lean(),
                    Category.findOne({ _id: product.categoryId }).lean()
                ]);
                // calculate ratings
                const avgRating = ratValue / review.length;

                const productDetails: any = {
                    ...product.toObject(),
                    customerAttributeDetails: [],
                    wholesalerAttributeDetails: [],
                    category,
                    rating: avgRating,
                    offers: offers,
                    offerDiscount: offers ? offers.discount : 0
                };

                const attrDetails = {
                    rowData: type === 'customer' ? product.customerAttribute?.rowData : product.wholesalerAttribute?.rowData,
                    attributeList: type === 'customer' ? customerAttributes : wholesalerAttributes,
                    attributeIds: (type === 'customer' ? customerAttrIds : wholesalerAttrIds)
                };

                if (type === 'customer') {
                    productDetails.customerAttributeDetails = ProductHelper.buildAttributeTree(
                        attrDetails.attributeList,
                        attrDetails.rowData || [],
                        attrDetails.attributeIds,
                        0,                // level
                        undefined,        // parentAttrName
                        undefined,        // parentAttrValue
                        undefined,        // parentId
                        product.customerTax
                    );
                } else {
                    productDetails.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                        attrDetails.attributeList,
                        attrDetails.rowData || [],
                        attrDetails.attributeIds,
                        0,                // level
                        undefined,        // parentAttrName
                        undefined,        // parentAttrValue
                        undefined,        // parentId
                        0
                    );
                }

                return productDetails;
            }));

            return successResponse('Top Selling Products', 200, result);

        } catch (error: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }


    async create(input: CreateOrderInput, userId: string) {
        try {
            //  generate invoiceId
            const invoiceId = await this.generateInvoiceId();
            // Get the latest order by orderCode
            const latestOrder = await OrderModel.findOne({ isActive: 1, isDelete: 0 })
                .sort({ orderCode: -1 })
                .lean();

            let count = latestOrder
                ? parseInt(latestOrder.orderCode.replace(/\D/g, ""), 10) + 1
                : 1;

            let orderCode;

            while (true) {
                orderCode = `ORD-${String(count).padStart(3, '0')}`;
                const exists = await OrderModel.exists({ orderCode, isActive: 1, isDelete: 0 });
                if (!exists) break;
                count++;
            }

            console.log(input, 'input from the user', invoiceId);

            let creditManagement = []
            let creditId = null
            if (input.paymentMode == 'CREDIT') {
                const findCreditTypeOrder = await OrderModel.find({
                    paymentMode: "CREDIT",
                    paymentStatus: { $ne: "paid" }
                });

                const totalPaidAmount = findCreditTypeOrder.reduce((total, order) => {
                    const orderPaidTotal = (order.creditManagement || []).reduce((sum, credit) => {
                        return sum + (Number(credit.paidAmount) || 0);
                    }, 0);
                    return total + orderPaidTotal;
                }, 0);
                const checkCreditLimit = await WholeSalerCreditModel.findOne({
                    wholeSalerId: new Types.ObjectId(input.placedBy),
                    isActive: true,
                    isDelete: false
                });

                if (!checkCreditLimit) {
                    return createErrorResponse(
                        "credit limit is not found error",
                        StatusCodes.NOT_FOUND,
                        "Credit limit is not found"
                    );
                }

                // if (Number(input.totalAmount) > Number(checkCreditLimit.creditLimit ?? 0)) {
                //     return createErrorResponse(
                //         "credit limit exceeded",
                //         StatusCodes.BAD_REQUEST,
                //         "Credit limit exceeded"
                //     );
                // }

                // const creditLimit = Number(checkCreditLimit.creditLimit ?? 0);
                // const inputPaidAmount = Number(input.paidAmount ?? 0);

                // const remainingBalance = creditLimit - totalPaidAmount;

                // if (inputPaidAmount > remainingBalance) {
                //     return createErrorResponse(
                //         "credit limit exceeded",
                //         StatusCodes.BAD_REQUEST,
                //         "Credit limit exceeded"
                //     );
                // }

                const limit = {
                    paidAmount: input.paidAmount,
                    paidDateAndTime: new Date(),
                    recivedUserId: null,
                    paymentType: input.paymentType,
                }
                console.log(new Types.ObjectId(checkCreditLimit._id));

                creditId = new Types.ObjectId(checkCreditLimit._id)
                creditManagement.push(limit)
            }
            // Save the new order
            const doc = new OrderModel({
                ...input, orderCode, creditId, createdBy: userId, modifiedBy: userId, creditManagement: creditManagement,
                invoiceId
            });
            const result = await doc.save();
            if (!result) {
                return createErrorResponse('Create error', StatusCodes.NOT_FOUND, 'Unable to palce order');
            }
            if (input.items) {
                await this.stockUpdation(input?.items);
                /* Remove cart details */
                await CartModel.updateOne({ userId: new Types.ObjectId(input.placedBy), isDelete: 0 }, {
                    isDelete: 1
                });
            }
            return successResponse('Order created', StatusCodes.CREATED, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async update(id: string, input: UpdateOrderInput, userId: string) {
        try {
            const updated = await OrderModel.findByIdAndUpdate(
                id,
                { $set: { ...input, modifiedBy: userId } },
                { new: true }
            );
            if (!updated) {
                return createErrorResponse('Not found', StatusCodes.NOT_FOUND, 'Order not found');
            }
            return successResponse('Order updated', StatusCodes.OK, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Update error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async updateStatus(customerId: string, amount: number, userId: string,) {
        try {
            let remainingAmount = amount;

            // Fetch customer's orders sorted by oldest first
            const customerOrders = await OrderModel.find({ placedBy: new Types.ObjectId(customerId), paymentStatus: 'pending' }).sort({ createdAt: 1 });

            for (const order of customerOrders) {
                if (remainingAmount <= 0) break;

                const dueAmount = order.totalAmount - (order.amountPaid || 0);

                let paymentToApply = 0;
                let newStatus = order.paymentStatus;

                if (remainingAmount >= dueAmount) {
                    // Enough to pay this order fully
                    paymentToApply = dueAmount;
                    newStatus = 'paid';
                } else {
                    // Partial payment
                    paymentToApply = remainingAmount;
                    newStatus = 'partially-paid';
                }

                // Update the order
                await OrderModel.findByIdAndUpdate(order._id, {
                    $inc: { amountPaid: paymentToApply },
                    $set: { paymentStatus: newStatus, modifiedBy: userId }
                });

                remainingAmount -= paymentToApply;
            }

            return successResponse('Payment applied', StatusCodes.OK, { message: 'Payment distributed to orders' });
        } catch (e: any) {
            return createErrorResponse('Status error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async list(params: {
        page: number; limit: number; type?: string; userId: string, orderStatus: string, paymentStatus?: string,
        dateFilter?: string, startDate?: string, endDate?: string, orderCode?: string
    }) {
        try {
            const { page, limit, type, userId, orderStatus, paymentStatus, dateFilter, startDate, endDate, orderCode } = params;
            // console.log(orderCode,"orderCode");

            const blockedStatuses = ['over-due', 'due-soon'];
            const placedByModel = type === 'customer' ? 'User' : type ?? '';
            const userObjectId = new Types.ObjectId(userId);
            const matchStage: any = {
                isDelete: false,
                placedBy: userObjectId,
                placedByModel
            };

            // Add orderCode search for customers only
            if (orderCode && type === 'customer') {
                matchStage.orderCode = { $regex: orderCode, $options: 'i' };
            }

            // Filter by date (using createdAt)
            if (dateFilter === 'today') {
                matchStage.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate()
                };
            } else if (dateFilter === 'week') {
                matchStage.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lte: moment().endOf('week').toDate()
                };
            } else if (dateFilter === 'month') {
                matchStage.createdAt = {
                    $gte: moment().startOf('month').toDate(),
                    $lte: moment().endOf('month').toDate()
                };
            } else if (startDate && endDate) {
                matchStage.createdAt = {
                    $gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate(),
                    $lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate()
                };
            }

            const pipeline: any[] = [{ $match: matchStage }];

            if (paymentStatus && !blockedStatuses.includes(paymentStatus)) {
                if (paymentStatus === 'order') {
                    pipeline.push({ $match: { paymentMode: 'CREDIT', paymentStatus: 'pending' } });
                } else {
                    pipeline.push({ $match: { paymentStatus } });
                }
            }

            if (orderStatus) {
                pipeline.push({ $match: { status: orderStatus } });
            }

            pipeline.push({ $sort: { createdAt: -1 } });

            if (limit > 0) {
                pipeline.push({ $skip: page * limit }, { $limit: limit });
            }

            const orders = await OrderModel.aggregate(pipeline);
            const total = await OrderModel.countDocuments(matchStage);

            const finalResult = await Promise.all(
                orders.map(async (order) => {
                    let userName = '', userAddress = '', overDue = false, creditDueDate: any;
                    let customerTotalTax = 0, wholesalerTotalTax = 0;

                    // Fetch user info
                    const isCustomer = ['customer', 'User', 'pos'].includes(type || '');
                    const userModel: any = isCustomer ? Users : WholesalerRetailsers;
                    const user = await userModel.findOne({ _id: order.placedBy, isActive: true, isDelete: false });

                    if (user) {
                        userName = user.name ?? '';
                        userAddress = user.address ?? '';
                    }

                    // Check for overdue
                    if (!isCustomer) {
                        const credit = await WholeSalerCreditModel.findOne({ wholeSalerId: userId, isActive: true, isDelete: false });
                        if (credit?.creditPeriod) {
                            creditDueDate = moment(order.createdAt).add(credit.creditPeriod, 'days');
                            overDue = moment().isAfter(creditDueDate, 'day');
                        }
                    }

                    // Resolve items
                    const products = await Promise.all(
                        order.items.map(async (item: any) => {
                            if (item.offerType === 'package') {
                                const offer = await OfferModel.findById(item.offerId);
                                return {
                                    _id: '',
                                    offerType: offer?.offerType ?? '',
                                    offerId: offer?._id ?? '',
                                    productName: offer?.offerName ?? '',
                                    productCartId: item._id,
                                    quantity: item.quantity,
                                    unitPrice: Number(item.unitPrice || 0),
                                    productImage: offer?.images ?? [],
                                    customerAttribute: { attributeId: [''], rowData: [{}, {}] },
                                    attributeData: [{
                                        _id: '', name: '', value: [{ value: '', _id: '', stock: 10, maxLimit: 10 }]
                                    }]
                                };
                            } else {
                                const product = await ProductModel.findOne({ _id: item.productId, isActive: 1, isDelete: 0 });
                                if (!product) return null;

                                const quantity = Number(item.quantity || 0);
                                const unitPrice = Number(item.unitPrice || 0);
                                const taxRate = Number(product.wholesalerTax || 0) / 100;
                                const taxAmount = taxRate * unitPrice;

                                wholesalerTotalTax += taxAmount * quantity;

                                const [category, review] = await Promise.all([
                                    Category.findById(product.categoryId),
                                    ReviewModel.findOne({
                                        orderId: order._id,
                                        userId: userObjectId,
                                        productId: product._id,
                                        isActive: 1,
                                        isDelete: 0
                                    })
                                ]);

                                const attrIds = Object.values(item?.attributes || {}).filter(val => typeof val === 'string').map(id => new Types.ObjectId(id));
                                const attributeData = await Promise.all(
                                    attrIds.map(id => Attribute.findOne({ "value._id": id }, { name: 1, value: { $elemMatch: { _id: id } } }))
                                );

                                const finalProduct: any = {
                                    ...product.toObject(),
                                    quantity,
                                    unitPrice,
                                    productCartId: item._id,
                                    attributeData,
                                    attributes: item.attributes,
                                    categoryName: category?.name ?? '',
                                    productReview: !!review,
                                    productwholesalerTaxPrice: taxAmount,
                                    offerId: item.offerId ?? '',
                                    offerType: item.offerType ?? ''
                                };

                                if (type === 'customer') delete finalProduct.wholesalerAttribute;
                                if (type === 'wholesaler') delete finalProduct.customerAttribute;

                                return finalProduct;
                            }
                        })
                    );

                    const baseTotal = order.totalAmount + (isCustomer ? customerTotalTax : wholesalerTotalTax) + (order.deliveryCharge || 0);

                    return {
                        ...order,
                        products: products.filter(Boolean),
                        customerTotalTax,
                        wholesalerTotalTax,
                        total: baseTotal,
                        subTotal: order.totalAmount,
                        userName,
                        userAddress,
                        deliveryCharge: order.deliveryCharge ?? 0,
                        overDue,
                        creditDueDate
                    };
                })
            );

            // Final filtering based on overdue/duesoon
            if (paymentStatus === 'over-due') {
                return Pagination(total, finalResult.filter(o => o.overDue === true && o.paymentStatus !== 'paid' && o.paymentMode === 'CREDIT'), limit, page);
            }

            if (paymentStatus === 'due-soon') {
                const filtered = finalResult.filter(o => o.creditDueDate && moment(o.creditDueDate).diff(moment(), 'days') <= 7 && o.overDue === false && o.paymentStatus !== 'paid' && o.paymentMode === 'CREDIT');
                return Pagination(total, filtered, limit, page);
            }

            return Pagination(total, finalResult, limit, page);
        } catch (e: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async delete(id: string, userId: string) {
        try {
            const del = await OrderModel.findByIdAndUpdate(id, {
                $set: { isDelete: true, modifiedBy: userId },
            });
            if (!del) {
                return createErrorResponse('Not found', StatusCodes.NOT_FOUND, 'Order not found');
            }
            return successResponse('Deleted', StatusCodes.OK, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Delete error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async getById(id: string) {
        try {
            const ord = await OrderModel.findById(id);
            if (!ord) {
                return createErrorResponse('Not found', StatusCodes.NOT_FOUND, 'Order not found');
            }
            return successResponse('Order fetched', StatusCodes.OK, ord);
        } catch (e: any) {
            return createErrorResponse('Get error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async lineManOrderList(params: {
        page: number;
        limit: number;
        type?: string;
        userId: string;
        status?: string;
        dateFilter?: string;
        startDate?: string;
        endDate?: string;
    }) {
        try {
            const {
                page,
                limit,
                type,
                userId,
                status,
                dateFilter,
                startDate,
                endDate,
            } = params;

            const skip = page * limit;
            const resolvedLimit = Number(limit);

            const filter: any = {
                isDelete: false,
                createdBy: new Types.ObjectId(userId),
                placedByModel: { $in: ['Wholesaler', 'Retailer', 'AdminUser'] },
            };
            // Date filter (createdAt)
            if (dateFilter === 'today') {
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate(),
                };
            }
            else if (dateFilter === 'yesterday') {
                filter.createdAt = {
                    $gte: moment().subtract(1, 'day').startOf('day').toDate(),
                    $lte: moment().subtract(1, 'day').endOf('day').toDate(),
                };
            }
            else if (dateFilter === 'thisWeek') {
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lte: moment().endOf('week').toDate(),
                };
            } else if (dateFilter === 'thisMonth') {
                filter.createdAt = {
                    $gte: moment().startOf('month').toDate(),
                    $lte: moment().endOf('month').toDate(),
                };
            } else if (startDate && endDate) {
                filter.createdAt = {
                    $gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate(),
                    $lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate(),
                };
            }

            // Status filter
            if (status) {
                filter.status = status;
            }

            // Fetch orders and count in parallel
            const [orders, total] = await Promise.all([
                OrderModel.find(filter)
                    .skip(skip)
                    .limit(resolvedLimit)
                    .sort({ createdAt: -1 }),
                OrderModel.countDocuments(filter),
            ]);

            const finalResult = await Promise.all(
                orders.map(async (order) => {
                    let wholesalerTotalTax = 0;

                    const [user, enhancedProducts] = await Promise.all([
                        WholesalerRetailsers.findOne({
                            _id: order.placedBy,
                            isActive: true,
                            isDelete: false,
                        }),
                        Promise.all(
                            order.items.map(async (item: any) => {
                                const product = await ProductModel.findOne({
                                    _id: new Types.ObjectId(item.productId),
                                    isActive: true,
                                    isDelete: false,
                                });
                                if (!product) return null;

                                const unitPrice = Number(item.unitPrice || 0);
                                const quantity = Number(item.quantity || 0);
                                const customerTaxRate = Number(product.customerTax || 0) / 100;
                                const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

                                const customerTaxPrice = customerTaxRate * unitPrice;
                                const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;
                                wholesalerTotalTax += wholesalerTaxPrice * quantity;

                                const [category, rating] = await Promise.all([
                                    Category.findById(product.categoryId),
                                    ReviewModel.findOne({
                                        orderId: new Types.ObjectId(order._id),
                                        userId: new Types.ObjectId(userId),
                                        productId: new Types.ObjectId(product._id),
                                        isActive: true,
                                        isDelete: false,
                                    }),
                                ]);

                                const attributeValueIds = Object.values(item.attributes || {}).filter(
                                    (val): val is string => typeof val === 'string'
                                );
                                const attributeObjectIds = attributeValueIds.map((id) => new Types.ObjectId(id));

                                const attributeData = await Promise.all(
                                    attributeObjectIds.map((id) =>
                                        Attribute.findOne(
                                            { 'value._id': id },
                                            {
                                                name: 1,
                                                value: { $elemMatch: { _id: id } },
                                            }
                                        )
                                    )
                                );

                                const finalProduct = {
                                    ...product.toObject(),
                                    quantity,
                                    unitPrice,
                                    productCartId: item._id,
                                    attributes: item.attributes,
                                    attributeData,
                                    categoryName: category?.name ?? '',
                                    productReview: !!rating,
                                    productcustomerTotalTax: customerTaxPrice,
                                    productwholesalerTaxPrice: wholesalerTaxPrice,
                                };

                                if (type === 'customer') delete finalProduct.wholesalerAttribute;
                                if (type === 'wholesaler') delete finalProduct.customerAttribute;

                                return finalProduct;
                            })
                        ),
                    ]);

                    return {
                        ...order.toObject(),
                        userName: user?.name ?? '',
                        products: enhancedProducts.filter(Boolean),
                        wholesalerTotalTax,
                        total:
                            Number(order.totalAmount) +
                            Number(wholesalerTotalTax) +
                            Number(order.deliveryCharge ?? 0),
                        subTotal: order.totalAmount,
                        deliveryCharge: Number(order?.deliveryCharge ?? 0),
                    };
                })
            );

            return Pagination(total, finalResult, resolvedLimit, page);
        } catch (e: any) {
            return createErrorResponse(
                'List error',
                StatusCodes.INTERNAL_SERVER_ERROR,
                e.message
            );
        }
    }

    async getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse> {
        try {
            const countFilter: any = {
                isActive: true,
                isDelete: false,
            };
            const { page, limit, search, pincode } = params
            const pipeLine = []

            if (pincode) {
                pipeLine.push({
                    $match: {
                        "pincode.code": pincode
                    }
                })
            }

            pipeLine.push({
                $match: {
                    isActive: true,
                    isDelete: false
                }
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
                    $lookup: {
                        from: 'adminusers',
                        localField: 'salesman',
                        foreignField: '_id',
                        as: 'salesmanDtls'
                    }
                },
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'deliveryman',
                        foreignField: '_id',
                        as: 'deliverymanDtls'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        rootName: 1,
                        pincode: 1,
                        salesman: { $arrayElemAt: ['$salesmanDtls.name', 0] },
                        deliveryCharge: 1,
                        deliveryman: { $arrayElemAt: ['$deliverymanDtls.name', 0] },
                        isDelete: 1,
                        isActive: 1,
                        createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
                        modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
                        createdAt: 1,
                        updatedAt: 1,
                        variants: 1
                    }
                }
            )
            if (limit > 0) {
                pipeLine.push(
                    { $skip: +page * limit },
                    { $limit: limit }
                );
            }

            const result = await RootModel.aggregate(pipeLine)
            const count = limit > 0 ? await RootModel.countDocuments(countFilter) : 0;

            return Pagination(count, result, limit, page);

        } catch (error: any) {
            return createErrorResponse(
                "Error in list route",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async updateOrderStatus(id: string, status: string, userId: string, reason: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const orders = await OrderModel.findOne({
                _id: new Types.ObjectId(id)
            });
            if (!orders) {
                return createErrorResponse(
                    'Order not found',
                    StatusCodes.NOT_FOUND,
                    'Order not found'
                );
            }
            const update = await OrderModel.updateOne({
                _id: new Types.ObjectId(id)
            }, {
                status: status,
                modifiedBy: new Types.ObjectId(userId),
                reason: reason
            });

            if (!update) {
                return createErrorResponse(
                    'Order error in stautus update',
                    StatusCodes.NOT_FOUND,
                    'Order error in stautus update'
                );
            }
            if (status === 'cancelled') {
                for (const val of orders.items) {
                    try {
                        const product = await ProductModel.findById(val.productId);
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
                            { $set: product }
                        );
                    } catch (error) {
                        console.error(`Error updating product ${val.productId}:`, error);
                    }
                }
            }
            return successResponse("Order updated successfully", StatusCodes.OK, { message: "" });

        } catch (error: any) {
            return createErrorResponse(
                'Error update order status',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async generateInvoiceId(): Promise<string> {
        const now = new Date();
        const yyyyMMdd = now.toISOString().split('T')[0].replace(/-/g, '');

        const randomNumber = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random number
        return `nalsuvai_invoice_${yyyyMMdd}-${randomNumber}`;
    }
    async stockUpdation(input: any[]) {
        for (const val of input) {
            try {
                const productsToUpdate = [];

                if (val.offerId) {
                    const offer = await OfferModel.findById(val.offerId);
                    if (!offer?.productId) continue;
                    productsToUpdate.push(...offer.productId.map((p: any) => p.id));
                } else if (val.productId) {
                    productsToUpdate.push(val.productId);
                }

                for (const productId of productsToUpdate) {
                    const product = await ProductModel.findById(productId);
                    if (!product || !val.attributes) continue;

                    const attributeTypes: ('wholesalerAttribute' | 'customerAttribute')[] = ['wholesalerAttribute', 'customerAttribute'];

                    for (const attrType of attributeTypes) {
                        const attrData = product[attrType];
                        if (!attrData?.rowData) continue;

                        const rowIndex = attrData.rowData.findIndex((row: any) =>
                            Object.values(val.attributes).every((attrVal: any) =>
                                Object.entries(row).some(([key, value]) =>
                                    !['sku', 'price', 'stock', 'maxLimit'].includes(key) &&
                                    value?.toString() === attrVal.toString()
                                )
                            )
                        );

                        if (rowIndex !== -1) {
                            const row = attrData.rowData[rowIndex];
                            const currentStock = parseInt(row.stock) || 0;
                            attrData.rowData[rowIndex].stock = (currentStock - val.quantity).toString();
                        }
                    }

                    await ProductModel.findByIdAndUpdate(product._id, { $set: product });
                }

            } catch (error) {
                console.error(`Error updating stock for item:`, val, error);
            }
        }

        return true;
    }
}