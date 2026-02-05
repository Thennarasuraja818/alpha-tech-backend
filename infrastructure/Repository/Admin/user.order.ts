import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import { _config } from "../../../config/config";
import { Types } from "mongoose";
import { UserOrderDomainRepository } from "../../../domain/admin/user.orderDomain";
import Pagination from "../../../api/response/paginationResponse";
import { OrderModel } from "../../../app/model/order";
import moment from "moment";
import Attribute from "../../../app/model/attribute";
import { ProductModel } from "../../../app/model/product";
import { ReviewModel } from "../../../app/model/review";
import Users from "../../../app/model/user";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import { WholeSalerCreditModel } from "../../../app/model/wholesaler.credit";
import Category from '../../../app/model/category';

class UserOrderRepository implements UserOrderDomainRepository {
    private db: any;

    constructor(db: any) {
        this.db = db;
    }
    async list(params: { page: number; limit: number; type?: string; userId: string, orderStatus: string }) {
        try {
            const { page, limit, type, userId, orderStatus } = params;
            const pipeline: any[] = [];
            let placedByModel = ''
            // const placedByModel = type === 'customer' ? 'User' : type === 'Retailer' ? 'Retailer' : 'Wholesaler';
            if (type === 'customer') {
                placedByModel = 'User'
            } else {
                placedByModel = type ?? ''
            }

            pipeline.push({
                $match: {
                    isDelete: false,
                    placedBy: new Types.ObjectId(userId),
                    placedByModel
                }
            });
            if (orderStatus) {
                pipeline.push({
                    $match: {
                        status: orderStatus
                    }
                })
            }
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

            const data = await OrderModel.aggregate(pipeline);

            const total = await OrderModel.countDocuments({
                isDelete: false,
                placedBy: new Types.ObjectId(userId),
                placedByModel
            });

            const finalResult = await Promise.all(
                data.map(async (cartItem) => {
                    let customerTotalTax = 0;
                    let wholesalerTotalTax = 0;
                    let userName = '';
                    let userAddress = '';
                    let overDue = false;
                    let creditDueDate: any;
                    // Fetch user name based on type
                    if (type === 'customer' || type === 'User' || type === 'pos') {
                        const user = await Users.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
                        userName = user?.name ?? '';
                        userAddress = user?.address ?? '';
                    } else if (type === 'Wholesaler' || type === 'Retailer' || type === 'pos') {
                        const user = await WholesalerRetailsers.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
                        userName = user?.name ?? '';
                        const checkOverdue = await WholeSalerCreditModel.findOne({
                            wholeSalerId: userId,
                            isActive: true,
                            isDelete: false
                        });

                        if (checkOverdue?.creditPeriod) {
                            const dueDate = moment(cartItem.createdAt).add(checkOverdue.creditPeriod, 'days');
                            if (moment().isAfter(dueDate, 'day')) {
                                overDue = true;
                                creditDueDate = dueDate;
                            } else {
                                creditDueDate = dueDate;
                            }
                        }
                    }

                    const enhancedProducts = await Promise.all(
                        cartItem.items.map(async (prod: any) => {
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
                                productcustomerTotalTax: customerTaxPrice,
                                productwholesalerTaxPrice: wholesalerTaxPrice,
                            };

                            // Remove unnecessary attributes
                            if (type === 'customer') {
                                delete finalProduct.wholesalerAttribute;
                            } else if (type === 'wholesaler') {
                                delete finalProduct.customerAttribute;
                            }

                            return finalProduct;
                        })
                    );

                    return {
                        ...cartItem,
                        products: enhancedProducts.filter(Boolean),
                        customerTotalTax,
                        wholesalerTotalTax,
                        total: cartItem.totalAmount + (type === 'customer' || type === 'User' ? customerTotalTax : wholesalerTotalTax) + (cartItem?.deliveryCharge ?? 0),
                        subTotal: cartItem.totalAmount,
                        userName,
                        deliveryCharge: (cartItem?.deliveryCharge ?? 0),
                        userAddress,
                        overDue,
                        creditDueDate
                    };
                })
            );

            return Pagination(total, finalResult, limit, page);
        } catch (e: any) {
            return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

}



export function newUserOrderRepository(db: any): UserOrderDomainRepository {
    return new UserOrderRepository(db);
}
