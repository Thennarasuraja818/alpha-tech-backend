import { Types } from 'mongoose';
import {
    ApiResponse, ErrorResponse, SuccessMessage
} from '../../../api/response/commonResponse';
import { StatusCodes } from 'http-status-codes';
import Pagination from "../../../api/response/paginationResponse";
import { successResponse } from '../../../utils/common/commonResponse';
import { createErrorResponse } from '../../../utils/common/errors';
import { ProductModel } from '../../../app/model/product';
import Attribute from '../../../app/model/attribute';
import Category from '../../../app/model/category';
import { ReviewModel } from '../../../app/model/review';
import Users from '../../../app/model/user';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
import { ReturnOrderDomainRepository } from '../../../domain/mobile-app/returnOrderDomain';
import { ReturnOrderModel } from '../../../app/model/ReturnOrder';
import { CreateReturnOrderInput, UpdateReturnOrderInput } from '../../../api/Request/return.order';
import { OrderModel } from '../../../app/model/order';
import OfferModel from '../../../app/model/Offer';
import moment from 'moment';
import { RootModel } from '../../../app/model/root';
export class ReturnOrderRepository implements ReturnOrderDomainRepository {
    constructor(private db: any) { }
    async create(input: CreateReturnOrderInput, userId: string) {
        try {
            // Get the latest order by orderCode
            const latestOrder = await ReturnOrderModel.findOne({ isActive: 1, isDelete: 0 })
                .sort({ orderCode: -1 })
                .lean();

            let count = latestOrder
                ? parseInt(latestOrder.orderCode.replace(/\D/g, ""), 10) + 1
                : 1;

            let orderCode;

            while (true) {
                orderCode = `REORD-${String(count).padStart(3, '0')}`;
                const exists = await ReturnOrderModel.exists({ orderCode, isActive: 1, isDelete: 0 });
                if (!exists) break;
                count++;
            }
            // Save the new order
            const doc = new ReturnOrderModel({ ...input, orderCode, createdBy: userId, modifiedBy: userId });
            const result = await doc.save();
            if (!result) {

                return createErrorResponse('Create error', StatusCodes.NOT_FOUND, 'Unable to palce order');
            }
            /* Update order status */
            if (input.isExchangeFlag === true) {
                await OrderModel.findByIdAndUpdate({ _id: input.orderId }, {
                    $set: {
                        status: 'exchange-initiated'
                    }
                });
            } else {
                await OrderModel.findByIdAndUpdate({ _id: input.orderId }, {
                    $set: {
                        status: 'return-initiated'
                    }
                });
            }

            return successResponse('Order created', StatusCodes.CREATED, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async update(id: string, input: UpdateReturnOrderInput, userId: string) {
        try {
            const updated = await ReturnOrderModel.findByIdAndUpdate(
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

    async list(params: { page: number; limit: number; type?: string; userId: string }) {
        try {
            const { page, limit, type, userId } = params;
            const pipeline: any[] = [];

            pipeline.push({
                $match: {
                    isDelete: false,
                    placedBy: new Types.ObjectId(userId),
                    placedByModel: type
                }
            });

            // Sort first, then apply pagination
            pipeline.push({
                $sort: { createdAt: -1 }
            });

            if (limit > 0) {
                pipeline.push(
                    { $skip: +page * +limit },
                    { $limit: +limit }
                );
            }

            const data = await ReturnOrderModel.aggregate(pipeline);

            const total = await ReturnOrderModel.countDocuments({
                isDelete: false,
                placedBy: new Types.ObjectId(userId),
                placedByModel: type
            });

            const finalResult = await Promise.all(
                data.map(async (cartItem) => {
                    let customerTotalTax = 0;
                    let wholesalerTotalTax = 0;
                    let userName = '';
                    const prodArr: any = [];

                    // Fetch user name based on type
                    if (type === 'User' || type === 'pos') {
                        const user = await Users.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
                        userName = user?.name ?? '';
                    } else if (type === 'Wholesaler' || type === 'Retailer') {
                        const user = await WholesalerRetailsers.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
                        userName = user?.name ?? '';
                    }

                    const enhancedProducts = await Promise.all(
                        cartItem.items.map(async (prod: any) => {
                            if (prod.offerType === 'package') {
                                const offer = await OfferModel.findOne({ _id: new Types.ObjectId(prod.offerId) });
                                prodArr.push({
                                    _id: "",
                                    offerType: offer?.offerType ?? '',
                                    offerId: offer?._id ?? '',
                                    productName: offer?.offerName ?? '',
                                    productCartId: prod._id,
                                    quantity: prod.quantity,
                                    offerAmount: 0,
                                    attributes: {},
                                    customerAttribute: {
                                        attributeId: [""],
                                        rowData: [
                                            { customermrp: "", maxLimit: "", price: "", sku: "", stock: "", Weight: "" },
                                            { customermrp: "", maxLimit: "", price: "", sku: "", stock: "", Weight: "" }
                                        ]
                                    },
                                    customerTax: 0,
                                    description: "",
                                    mrpPrice: 0,
                                    unitPrice: Number(prod.unitPrice || 0),
                                    productImage: offer?.images,
                                    wholesalerTax: 0,
                                    "attributeData": [
                                        {
                                            "_id": "",
                                            "name": "",
                                            "value": [
                                                {
                                                    "value": "",
                                                    "_id": "",
                                                    "stock": 10,
                                                    "maxLimit": 10
                                                }
                                            ]
                                        }
                                    ],
                                });
                            } else {
                                const product = await ProductModel.findOne({
                                    _id: new Types.ObjectId(prod.productId),
                                    isActive: 1,
                                    isDelete: 0
                                });

                                if (!product) return null;

                                const unitPrice = Number(prod.unitPrice || 0);
                                const quantity = Number(prod.quantity || 0);

                                const customerTaxRate = Number(product.customerTax || 0) / 100;
                                const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

                                // const customerTaxPrice = customerTaxRate * unitPrice;
                                const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;

                                // customerTotalTax += customerTaxPrice * quantity;
                                wholesalerTotalTax += wholesalerTaxPrice * quantity;

                                const [category, rating] = await Promise.all([
                                    Category.findOne({ _id: new Types.ObjectId(product.categoryId) }),
                                    ReviewModel.findOne({
                                        orderId: new Types.ObjectId(cartItem._id),
                                        userId: new Types.ObjectId(userId),
                                        productId: new Types.ObjectId(product._id),
                                        isActive: 1,
                                        isDelete: 0
                                    })
                                ]);

                                const attributeValueIds = Object.values(prod?.attributes || {}).filter(
                                    (val): val is string => typeof val === "string"
                                );

                                const attributeObjectIds = attributeValueIds.map(id => new Types.ObjectId(id));

                                const attributeData = await Promise.all(
                                    attributeObjectIds.map(id =>
                                        Attribute.findOne(
                                            { "value._id": id },
                                            {
                                                name: 1,
                                                value: { $elemMatch: { _id: id } }
                                            }
                                        )
                                    )
                                );

                                const productData = product.toObject();

                                const finalProduct = {
                                    ...productData,
                                    quantity,
                                    unitPrice,
                                    productCartId: prod._id,
                                    attributeData,
                                    attributes: prod.attributes,
                                    categoryName: category?.name ?? '',
                                    productReview: !!rating,
                                    // productcustomerTotalTax: customerTaxPrice,
                                    productwholesalerTaxPrice: wholesalerTaxPrice
                                };

                                // Remove unnecessary attributes
                                if (type === 'User') {
                                    delete finalProduct.wholesalerAttribute;
                                } else if (type === 'Wholesaler' || type === 'Retailer') {
                                    delete finalProduct.customerAttribute;
                                }
                                prodArr.push(finalProduct)
                            }
                        })
                    );

                    return {
                        ...cartItem,
                        products: prodArr,
                        customerTotalTax,
                        wholesalerTotalTax,
                        total: cartItem.totalAmount + (type === 'User' ? customerTotalTax : wholesalerTotalTax) + (cartItem?.deliveryCharge ?? 0),
                        subTotal: cartItem.totalAmount,
                        userName,
                        deliveryCharge: (cartItem?.deliveryCharge ?? 0)
                    };
                })
            );

            return Pagination(total, finalResult, limit, page);
        } catch (e: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async delete(id: string, userId: string) {
        try {
            const del = await ReturnOrderModel.findByIdAndUpdate(id, {
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

    async updateOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const orders = await ReturnOrderModel.findOne({
                _id: new Types.ObjectId(id)
            });
            if (!orders) {
                return createErrorResponse(
                    'Order not found',
                    StatusCodes.NOT_FOUND,
                    'Order not found'
                );
            }
            const update = await ReturnOrderModel.updateOne({
                _id: new Types.ObjectId(id)
            }, {
                status: status,
                modifiedBy: new Types.ObjectId(userId)
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

    async getReturnExchangeList(params: any) {
        const { status, dateFilter, startDate, endDate, userId, limit, page } = params;
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

        // Build match stage
        const matchStage: any = {
            isDelete: false,
            'shippingAddress.postalCode': { $in: pincodes }
        };

        // Filter by status if provided
        if (status) {
            matchStage.status = status;
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

        const count = await ReturnOrderModel.countDocuments(matchStage)
        const list = await ReturnOrderModel.aggregate([
            { $match: matchStage },
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
                $project: {
                    _id: 1,
                    returnAmount: '$amount',
                    reason: 1,
                    status: 1,
                    orderNo: '$order.orderCode',
                    orderDate: {
                        $dateToString: { format: '%d %b %Y', date: '$createdAt' }
                    },
                    isExchangeFlag: 1,
                    totalAmount: 1,
                    deliveryCharge: 1,
                    subTotal: 1,
                    totalTaxValue: 1,
                    shippingAddress: 1,
                    items: 1,
                    placedByModel: 1,
                    placedBy: 1,
                    orderId: '$order._id',

                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        const finalResult = await Promise.all(
            list.map(async (cartItem) => {
                let customerTotalTax = 0;
                let wholesalerTotalTax = 0;
                let customerName = '';
                const users = ['AdminUser', 'Wholesaler', 'Retailer']
                // Fetch user name based on type
                if (cartItem.placedByModel === 'User') {
                    const user = await Users.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
                    customerName = user?.name ?? '';
                } else if (users.includes(cartItem.placedByModel)) {
                    const user = await WholesalerRetailsers.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
                    customerName = user?.name ?? '';
                }
                const enhancedProducts = await Promise.all(
                    cartItem?.items.map(async (prod: any) => {
                        const product = await ProductModel.findOne({
                            _id: new Types.ObjectId(prod.productId),
                            isActive: 1,
                            isDelete: 0
                        });

                        if (!product) return null;

                        const unitPrice = Number(prod.unitPrice || 0);
                        const quantity = Number(prod.quantity || 0);

                        const customerTaxRate = Number(product.customerTax || 0) / 100;
                        const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

                        const customerTaxPrice = customerTaxRate * unitPrice;
                        const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;

                        customerTotalTax += customerTaxPrice * quantity;
                        wholesalerTotalTax += wholesalerTaxPrice * quantity;

                        const [category] = await Promise.all([
                            Category.findOne({ _id: new Types.ObjectId(product.categoryId) }),

                        ]);

                        const attributeValueIds = Object.values(prod?.attributes || {}).filter(
                            (val): val is string => typeof val === "string"
                        );

                        const attributeObjectIds = attributeValueIds.map(id => new Types.ObjectId(id));

                        const attributeData = await Promise.all(
                            attributeObjectIds.map(id =>
                                Attribute.findOne(
                                    { "value._id": id },
                                    {
                                        name: 1,
                                        value: { $elemMatch: { _id: id } }
                                    }
                                )
                            )
                        );

                        const productData = product.toObject();

                        const finalProduct = {
                            ...productData,
                            quantity,
                            unitPrice,
                            productCartId: prod._id,
                            attributeData,
                            attributes: prod.attributes,
                            categoryName: category?.name ?? '',
                            productcustomerTotalTax: customerTaxPrice,
                            productwholesalerTaxPrice: wholesalerTaxPrice
                        };

                        // Remove unnecessary attributes
                        if (cartItem.placedByModel === 'User') {
                            delete finalProduct.wholesalerAttribute;
                        } else {
                            delete finalProduct.customerAttribute;
                        }
                        return finalProduct;
                    })
                );
                delete cartItem.items;
                return {
                    ...cartItem,
                    products: enhancedProducts.filter(Boolean),
                    customerTotalTax,
                    wholesalerTotalTax,
                    // total: cartItem.totalAmount + (params.type === 'customer' ? customerTotalTax : wholesalerTotalTax) + (cartItem?.deliveryCharge ?? 0),
                    total: cartItem.totalAmount,
                    subTotal: cartItem.totalAmount,
                    customerName,
                    deliveryCharge: (cartItem?.deliveryCharge ?? 0)
                };
            })
        );
        return Pagination(count, finalResult, limit, page);
    }


}