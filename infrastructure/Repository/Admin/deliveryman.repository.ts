import { Types } from 'mongoose';
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from '../../../utils/common/errors';
import { StatusCodes } from 'http-status-codes';
import Category from '../../../app/model/category';
import { DeliverymanDomainRepository } from '../../../domain/admin/deliverymanDomain';
import moment from 'moment';
import { OrderModel } from '../../../app/model/order';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
import { ProductModel } from '../../../app/model/product';
import { ReviewModel } from '../../../app/model/review';
import Attribute from '../../../app/model/attribute';
import Pagination from '../../../api/response/paginationResponse';
import { RootModel } from '../../../app/model/root';
import { UpdateComplaintStatus, UpdateDeiveryStatusInput, UpdateRequestStatus } from '../../../api/Request/vehicleComplaint';
import { VehicleComplaint } from '../../../app/model/vehicleComplaint';
import { SuccessMessage } from '../../../api/response/commonResponse';
import Users from '../../../app/model/user';
import { CreateDeliveryReqInput } from '../../../api/Request/deliverymanreq';
import DeliveryManReq from '../../../app/model/DeliveryManReq';
export class DeliveryManRepository implements DeliverymanDomainRepository {
    constructor(private db: any) { }

    async deliveryManOrderList(params: {
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

            const route = await RootModel.findOne({
                deliveryman: new Types.ObjectId(userId),
                isDelete: false,
                isActive: true,
            }, { pincode: 1 });

            const pincodes = route?.pincode.map((p) => p.code) ?? [];

            const filter: any = {
                isDelete: false,
                status: 'shipped',
                placedByModel: { $in: ['Wholesaler', 'Retailer', 'AdminUser', 'User'] },
                'shippingAddress.postalCode': { $in: pincodes },
            };

            const now = moment();
            if (dateFilter === 'today') {
                filter.createdAt = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
            } else if (dateFilter === 'yesterday') {
                filter.createdAt = {
                    $gte: now.subtract(1, 'day').startOf('day').toDate(),
                    $lte: now.endOf('day').toDate(),
                };
            } else if (dateFilter === 'thisWeek') {
                filter.createdAt = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
            } else if (dateFilter === 'thisMonth') {
                filter.createdAt = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
            } else if (startDate && endDate) {
                filter.createdAt = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lte: moment(endDate).endOf('day').toDate(),
                };
            }

            if (status) filter.status = status;

            const [orders, total] = await Promise.all([
                OrderModel.find(filter).skip(skip).limit(resolvedLimit).sort({ createdAt: -1 }).lean(),
                OrderModel.countDocuments(filter),
            ]);

            const allPlacedByIds = [...new Set(orders.map(o => o.placedBy.toString()))];
            const allProductIds = [...new Set(orders.flatMap(o => o.items.map((i: any) => i.productId.toString())))];

            const wholesalerUsers = await WholesalerRetailsers.find({
                _id: { $in: allPlacedByIds },
                isActive: true,
                isDelete: false
            }).lean();

            const regularUsers = await Users.find({
                _id: { $in: allPlacedByIds },
                isActive: true,
                isDelete: false
            }).lean();

            const productDocs = await ProductModel.find({
                _id: { $in: allProductIds },
                isActive: true,
                isDelete: false
            }).lean();

            const categoryIds = productDocs.map(p => p.categoryId);
            const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
            const reviews = await ReviewModel.find({
                orderId: { $in: orders.map(o => o._id) },
                userId: new Types.ObjectId(userId),
                isActive: true,
                isDelete: false,
            }).lean();

            const attributesNeeded = [...new Set(
                orders.flatMap(o => o.items.flatMap(i => Object.values(i.attributes || {})))
            )];

            const attributeObjectIds = attributesNeeded
                .filter(val => typeof val === 'string')
                .map(id => new Types.ObjectId(id));

            const attributeDocs = await Attribute.find(
                { 'value._id': { $in: attributeObjectIds } },
                { name: 1, value: 1 }
            ).lean();

            const getAttributeData = (attrs: any) => {
                return Object.values(attrs || {}).map((val: any) => {
                    return attributeDocs.find(ad => ad.value.some(v => v._id.toString() === val));
                }).filter(Boolean);
            };

            const finalResult = orders.map(order => {
                const user = (order.placedByModel === 'User'
                    ? regularUsers
                    : wholesalerUsers
                ).find(u => u._id.toString() === order.placedBy.toString());

                let wholesalerTotalTax = 0;

                const products = order.items.map((item: any) => {
                    const product = productDocs.find(p => p._id.toString() === item.productId.toString());
                    if (!product) return null;

                    const unitPrice = Number(item.unitPrice || 0);
                    const quantity = Number(item.quantity || 0);
                    const customerTaxRate = Number(product.customerTax || 0) / 100;
                    const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

                    const customerTaxPrice = customerTaxRate * unitPrice;
                    const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;

                    wholesalerTotalTax += wholesalerTaxPrice * quantity;

                    const category = categories.find(c => c._id.toString() === product.categoryId?.toString());
                    const review = reviews.find(r => r.productId.toString() === product._id.toString());

                    const finalProduct = {
                        ...product,
                        quantity,
                        unitPrice,
                        productCartId: item._id,
                        attributes: item.attributes,
                        attributeData: getAttributeData(item.attributes),
                        categoryName: category?.name ?? '',
                        productReview: !!review,
                        productcustomerTotalTax: customerTaxPrice,
                        productwholesalerTaxPrice: wholesalerTaxPrice,
                    };

                    if (type === 'customer') delete finalProduct.wholesalerAttribute;
                    if (type === 'wholesaler') delete finalProduct.customerAttribute;

                    return finalProduct;
                }).filter(Boolean);

                return {
                    ...order,
                    userName: user?.name ?? '',
                    products,
                    wholesalerTotalTax,
                    total: Number(order.totalAmount) + wholesalerTotalTax + Number(order.deliveryCharge ?? 0),
                    subTotal: order.totalAmount,
                    deliveryCharge: Number(order.deliveryCharge ?? 0),
                };
            });

            return Pagination(total, finalResult, resolvedLimit, page);
        } catch (e: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async deliveryComplaintList(params: {
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

            console.log(userId, 'sssss');

            const filter: any = {
                isDelete: false,
            };

            if (status) filter.status = status;

            const now = moment();
            if (dateFilter === 'today') {
                filter.createdAt = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
            } else if (dateFilter === 'yesterday') {
                filter.createdAt = {
                    $gte: now.subtract(1, 'day').startOf('day').toDate(),
                    $lte: now.endOf('day').toDate(),
                };
            } else if (dateFilter === 'thisWeek') {
                filter.createdAt = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
            } else if (dateFilter === 'thisMonth') {
                filter.createdAt = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
            } else if (startDate && endDate) {
                filter.createdAt = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lte: moment(endDate).endOf('day').toDate(),
                };
            }


            const [orders, total] = await Promise.all([
                VehicleComplaint.find(filter).skip(skip).limit(resolvedLimit).sort({ createdAt: -1 }).lean(),
                VehicleComplaint.countDocuments(filter),
            ]);


            return Pagination(total, orders, resolvedLimit, page);
        } catch (e: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async requestList(params: {
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
            };

            if (status) filter.status = status;

            const now = moment();
            if (dateFilter === 'today') {
                filter.createdAt = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
            } else if (dateFilter === 'yesterday') {
                filter.createdAt = {
                    $gte: now.subtract(1, 'day').startOf('day').toDate(),
                    $lte: now.endOf('day').toDate(),
                };
            } else if (dateFilter === 'thisWeek') {
                filter.createdAt = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
            } else if (dateFilter === 'thisMonth') {
                filter.createdAt = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
            } else if (startDate && endDate) {
                filter.createdAt = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lte: moment(endDate).endOf('day').toDate(),
                };
            }


            const [orders, total] = await Promise.all([
                DeliveryManReq.find(filter).skip(skip).limit(resolvedLimit).sort({ createdAt: -1 }).lean(),
                DeliveryManReq.countDocuments(filter),
            ]);


            return Pagination(total, orders, resolvedLimit, page);
        } catch (e: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async updateRequestStatus(id: string, input: UpdateRequestStatus, userId: string) {
        try {

            const order = await DeliveryManReq.findOne({ _id: id, isActive: true, isDelete: false });
            if (!order) {
                return createErrorResponse('Deliveryman request found', StatusCodes.NOT_FOUND);
            }

            await DeliveryManReq.updateOne(
                { _id: order._id, isActive: true, isDelete: false },
                {
                    $set: {
                        status: input.status,
                        modifiedBy: new Types.ObjectId(userId)
                    }
                }
            );

            return successResponse('Deliveryman request status updated successfully', StatusCodes.OK, { message: 'Deliveryman request status updated successfully' });
        } catch (e: any) {
            return createErrorResponse('Error updating deliveryman status', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async updateComplaintStatus(id: string, input: UpdateComplaintStatus, userId: string) {
        try {

            const order = await VehicleComplaint.findOne({ _id: id, isActive: true, isDelete: false });
            if (!order) {
                return createErrorResponse('Deliveryman complaint not found', StatusCodes.NOT_FOUND);
            }

            await VehicleComplaint.updateOne(
                { _id: order._id, isActive: true, isDelete: false },
                {
                    $set: {
                        status: input.status,
                        modifiedBy: new Types.ObjectId(userId)
                    }
                }
            );

            return successResponse('Deliveryman complaint status updated successfully', StatusCodes.OK, { message: 'Deliveryman complaint status updated successfully' });
        } catch (e: any) {
            return createErrorResponse('Error updating deliveryman status', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
}

export const NewDeliveryManRepository = (db: any) => new DeliveryManRepository(db);
