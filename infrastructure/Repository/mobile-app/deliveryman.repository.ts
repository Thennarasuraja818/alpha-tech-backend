import { Types } from 'mongoose';
import { successResponse } from "../../../utils/common/commonResponse";
import { createErrorResponse } from '../../../utils/common/errors';
import { StatusCodes } from 'http-status-codes';
import { Uploads } from '../../../utils/uploads/image.upload';
import { UploadedFile } from 'express-fileupload';
import Category from '../../../app/model/category';
import { DeliverymanDomainRepository } from '../../../domain/mobile-app/deliverymanDomain';
import { CreateKilometerInput, UpdateKilometerInput } from '../../../api/Request/KilometerReq';
import KilometerHistory from '../../../app/model/KilometerHistory';
import moment from 'moment';
import { OrderModel } from '../../../app/model/order';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
import { ProductModel } from '../../../app/model/product';
import { ReviewModel } from '../../../app/model/review';
import Attribute from '../../../app/model/attribute';
import Pagination from '../../../api/response/paginationResponse';
import { RootModel } from '../../../app/model/root';
import { CreateVehicleComplaintInput, UpdateDeiveryStatusInput, UpdateVehicleComplaintInput } from '../../../api/Request/vehicleComplaint';
import { VehicleComplaint } from '../../../app/model/vehicleComplaint';
import { SuccessMessage } from '../../../api/response/commonResponse';
import Users from '../../../app/model/user';
import { CreateDeliveryReqInput } from '../../../api/Request/deliverymanreq';
import DeliveryManReq from '../../../app/model/DeliveryManReq';
import ReturnPickedUp from '../../../app/model/ReturnPickedUp';
import { CreateReturnPickedUpInput } from '../../../api/Request/returnpickedup';
import { ReturnOrderModel } from '../../../app/model/ReturnOrder';
import { ReceiveCashSettlementInput } from '../../../api/Request/cashsettle';
import { ReturnSettlementInput } from '../../../api/Request/returnpickedupsettlement';
import ReturnPickedUpSettled from '../../../app/model/ReturnPickedUpSettled';
export class DeliveryManRepository implements DeliverymanDomainRepository {
    constructor(private db: any) { }

    async createKilometerHistory(input: CreateKilometerInput, userId: string) {
        try {
            const imageArr: string[] = [];
            // Handle image upload
            if (input?.beforeImg && (input.beforeImg as unknown as UploadedFile)) {
                const image = await Uploads.processFiles(
                    input.beforeImg,
                    "kilometer",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }

            // Create offer document
            const doc = await KilometerHistory.create({
                start: Number(input?.start) ?? 0,
                beforeImg: imageArr,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
                userId: new Types.ObjectId(userId),
                date: input.date
            });

            return successResponse('Kilometer history created', StatusCodes.OK, doc);
        } catch (e: any) {
            return createErrorResponse('Error creating kilometer', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async updateKilometerHistory(input: UpdateKilometerInput, userId: string) {
        try {

            const offerData = await KilometerHistory.findOne({ date: input.date, userId: userId, isActive: true, isDelete: false });
            if (!offerData) {
                return createErrorResponse('Kilometer data not found', StatusCodes.NOT_FOUND);
            }
            const imageArr: string[] = [];

            if (input?.afterImg && (input.afterImg as unknown as UploadedFile)) {
                const image = await Uploads.processFiles(
                    input.afterImg,
                    "kilometer",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }
            console.log(imageArr, 'imageArr');

            const result = await KilometerHistory.updateOne(
                { _id: offerData._id, isActive: true, isDelete: false },
                {
                    $set: {
                        end: Number(input.end) ?? 0,
                        afterImg: imageArr,
                        modifiedBy: new Types.ObjectId(userId),
                        total: (Number(input.end) ?? 0) - (offerData.start)
                    }
                }
            );

            return successResponse('Kilometer history updated', StatusCodes.OK, { message: 'Kilometer history updated' });
        } catch (e: any) {
            return createErrorResponse('Error updating kilometer history', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

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

    async createVehicleComplaint(input: CreateVehicleComplaintInput, userId: string) {
        try {
            let proofUrl: string[] = [];
            console.log(input?.proof, 'input?.proof');

            if (input?.proof) {
                // Convert to array if single file
                if (input?.proof && input?.type === 'video' && (input.proof as unknown as UploadedFile)) {
                    const uploadedFiles = await Uploads.processFiles(
                        input.proof,
                        "vehicle-complaints",
                        "video",
                        ''
                    );

                    proofUrl.push(...uploadedFiles);
                } else {
                    // Convert to array if single file
                    if (input?.proof && (input.proof as unknown as UploadedFile)) {
                        const uploadedFiles = await Uploads.processFiles(
                            input.proof,
                            "vehicle-complaints",
                            "img",
                            ''
                        );

                        proofUrl.push(...uploadedFiles);
                    }
                }

            }

            // Create the complaint record
            const doc = await VehicleComplaint.create({
                ...input,
                proof: proofUrl,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
                userId: new Types.ObjectId(userId),
                status: 'pending',
                proofType: input.type
            });

            return successResponse('Complaint created successfully', StatusCodes.OK, doc);


        } catch (e: any) {
            console.error('Error in createVehicleComplaint:', e);
            return createErrorResponse(
                e.message || 'Error creating complaint',
                StatusCodes.INTERNAL_SERVER_ERROR,
                e.message
            );
        }
    }
    async updateVehicleComplaint(id: string, input: UpdateVehicleComplaintInput, userId: string) {
        try {
            const complaint: any = await VehicleComplaint.findOne({ _id: new Types.ObjectId(id) });
            if (!complaint) {
                return createErrorResponse('Complaint not found', StatusCodes.NOT_FOUND);
            }

            let proofUrl = complaint.proof || [];

            if (input?.proof) {
                if (input.type === 'video') {
                    // Convert to array if single file
                    if (input?.proof && (input.proof as unknown as UploadedFile)) {
                        const uploadedFiles = await Uploads.processFiles(
                            input.proof,
                            "vehicle-complaints",
                            "video",
                            complaint?.proof[0]?.docName
                        );

                        proofUrl.push(...uploadedFiles);
                    } else {
                        // Convert to array if single file
                        if (input?.proof && (input.proof as unknown as UploadedFile)) {
                            const uploadedFiles = await Uploads.processFiles(
                                input.proof,
                                "vehicle-complaints",
                                "img",
                                complaint?.proof[0]?.docName
                            );

                            proofUrl.push(...uploadedFiles);
                        }
                    }
                }

            }
            await VehicleComplaint.updateOne(
                { _id: new Types.ObjectId(id) },
                {
                    $set: {
                        ...input,
                        proof: proofUrl,
                        modifiedBy: new Types.ObjectId(userId),
                        modifiedAt: new Date()
                    }
                }
            );

            // Return a properly typed success response
            return successResponse('Complaint updated successfully', StatusCodes.OK, {
                message: 'Complaint updated successfully'
            } as SuccessMessage);
        } catch (e: any) {
            return createErrorResponse('Error updating complaint', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
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
                userId: new Types.ObjectId(userId)
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

    async updateDeliveryStatus(id: string, input: UpdateDeiveryStatusInput, userId: string) {
        try {

            const order = await OrderModel.findOne({ _id: id, isActive: true, isDelete: false });
            if (!order) {
                return createErrorResponse('Order not found', StatusCodes.NOT_FOUND);
            }
            if (input.otp && input.otp !== 123456) {
                return createErrorResponse('Otp not matched', StatusCodes.BAD_REQUEST);
            }
            const result = await OrderModel.updateOne(
                { _id: order._id, isActive: true, isDelete: false },
                {
                    $set: {
                        status: input.status,
                        otp: null,
                        modifiedBy: new Types.ObjectId(userId)
                    }
                }
            );

            return successResponse('Order delivered successfully', StatusCodes.OK, { message: 'Order delivered successfully' });
        } catch (e: any) {
            return createErrorResponse('Error updating delivery status history', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async createRequest(input: CreateDeliveryReqInput, userId: string) {
        try {

            // Create offer document
            const doc = await DeliveryManReq.create({
                type: input.type,
                notes: input.notes,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
                userId: new Types.ObjectId(userId),
            });

            return successResponse('Delivery man request created', StatusCodes.OK, doc);
        } catch (e: any) {
            return createErrorResponse('Error creating request', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
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
                userId: new Types.ObjectId(userId)
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

    async createReturnPickedUp(input: CreateReturnPickedUpInput, userId: string) {

        try {
            const exist = await ReturnPickedUp.findOne({ orderId: input.orderId, isActive: true, isDelete: false });
            if (exist) {
                return createErrorResponse('This order is already created', 400, 'This order is already created')

            }
            const create = await ReturnPickedUp.create({
                ...input,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
            });
            if (create) {
                await ReturnOrderModel.findOneAndUpdate({ _id: input.orderId }, {
                    $set: {
                        status: 'Item Picked Up'
                    }
                })
            }
            return successResponse('Return picked up created', StatusCodes.OK, create);

        } catch (e) {
            return createErrorResponse('unable to create returnpickedup', 400, 'unable to create returnpickedup')
        }
    }
    async returnPickedUpList(params: {
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

            console.log(userId, 'userId');

            const filter: any = {
                isDelete: false,
                createdBy: new Types.ObjectId(userId),
                settlementId: null
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
            } else {
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate(),
                };
            }
            const operation: any = [];

            operation.push({
                $match: filter
            }, {
                $lookup: {
                    from: 'orders',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'orders'
                }
            },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'orders.placedBy',
                        foreignField: '_id',
                        as: 'users'
                    }
                }, {
                $lookup: {
                    from: 'wholesalerretailers',
                    localField: 'orders.placedBy',
                    foreignField: '_id',
                    as: 'wholesalerretailers'
                }
            },
                {
                    $addFields: {
                        customer: {
                            $cond: {
                                if: { $gt: [{ $size: '$users' }, 0] },
                                then: '$users',
                                else: '$wholesalerretailers'
                            }
                        }
                    }
                },

                {
                    $project: {
                        _id: 1,
                        orderCode: { $arrayElemAt: ['$orders.orderCode', 0] },
                        customerName: { $arrayElemAt: ['$customer.name', 0] },
                        address: { $arrayElemAt: ['$orders.shippingAddress', 0] },
                        createdAt: 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: page * limit },
                { $limit: limit })


            const [orders, total] = await Promise.all([
                ReturnPickedUp.aggregate(operation),
                ReturnPickedUp.countDocuments(filter),
            ]);


            return Pagination(total, orders, resolvedLimit, page);
        } catch (e: any) {
            return createErrorResponse('List error', 400, e.message);
        }
    }
    async returnPickedUpSettlement(input: ReturnSettlementInput, userId: string) {
        try {

            const newSettlement = await ReturnPickedUpSettled.create({
                pickedUpIds: input.pickedUpIds.split(',').map((e) => new Types.ObjectId(e)),
                date: input.date,
                handOverTo: input.handoverTo,
                notes: input.notes,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
            });

            // Link unsettled cash payments for today
            const startOfToday = moment(input.date).startOf("day").toDate();
            const endOfToday = moment(input.date).endOf("day").toDate();

            await ReturnPickedUp.updateMany(
                {
                    createdBy: userId,
                    createdAt: { $gte: startOfToday, $lte: endOfToday },
                    settlementId: null
                },
                {
                    $set: { settlementId: newSettlement._id }
                }
            );

            return successResponse('Return picked up settlement completed', StatusCodes.OK, {});

        } catch (err: any) {
            return createErrorResponse(
                'Error creating',
                StatusCodes.INTERNAL_SERVER_ERROR,
                err.message
            );
        }
    }
    async getKilometerDetails(input: any, userId: string) {
        try {
            console.log(userId, 'userId', input.date);

            const offerData = await KilometerHistory.findOne({ date: input.date, userId: userId, isActive: true, isDelete: false, start: { $ne: 0 } });
            console.log(offerData);

            if (!offerData) {
                return createErrorResponse('Kilometer data not found', StatusCodes.NOT_FOUND);
            }
            return successResponse('Kilometer details listed', StatusCodes.OK, {
                message: 'Kilometer details listed',
                data: offerData
            });

        } catch (e: any) {
            return createErrorResponse('Error kilometer history', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
}

export const NewDeliveryManRepository = (db: any) => new DeliveryManRepository(db);
