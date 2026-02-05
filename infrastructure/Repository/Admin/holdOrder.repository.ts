import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import { ApiResponse, ErrorResponse } from '../../../api/response/commonResponse';
import { createErrorResponse } from '../../../utils/common/errors';
import { successResponse } from '../../../utils/common/commonResponse';
import { HoldOrderDomainRepository } from '../../../domain/admin/holdOrder.domain';
import { HoldOrderModel } from '../../../app/model/holdOrder';
import moment from 'moment';
import Pagination from '../../../api/response/paginationResponse';
import Admin from '../../../app/model/admin';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
import CustomerVariants from '../../../app/model/customerVariant';

export class HoldOrderRepository implements HoldOrderDomainRepository {

    async create(data: any, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            console.log(data, 'data in repo');
            const preparedData = {
                ...data,
                isActive: true,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
            };

            const result = await HoldOrderModel.create(preparedData);
            console.log(result, 'result in repo');
            return successResponse('Order hold successfully', StatusCodes.CREATED, result);
        } catch (error: any) {
            return createErrorResponse('Failed to hold order', StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Unknown error');
        }
    }



    async list(params: {
        page: number;
        limit: number;
        userId: string;
        orderStatus: string;
        holdOrderId?: string;
        orderFrom?: string;
    }) {
        try {
            const {
                page,
                limit,
                userId,
                orderStatus,
                holdOrderId,
                orderFrom
            } = params;

            const skip = page * limit;

            const match: any = {
                isActive: true,
                isDelete: false,
            };
            console.log("limit", limit)
            console.log("page", page)

            const isAdmin = await Admin.findOne({ _id: new mongoose.Types.ObjectId(userId) });
            console.log('Is Admin:', isAdmin);
            if (!isAdmin) match.createdBy = new mongoose.Types.ObjectId(userId);
            if (orderStatus) match.orderStatus = orderStatus;
            if (holdOrderId && mongoose.Types.ObjectId.isValid(holdOrderId))
                match.holdOrderId = new mongoose.Types.ObjectId(holdOrderId);
            if (orderFrom) match.orderFrom = orderFrom;

            console.log({ match });

            // Fetch customer variant if user is not admin
            let customerVariantName = null;
            if (!isAdmin) {
                const customer = await WholesalerRetailsers.findOne({ _id: userId });
                if (customer?.customerVariant) {
                    const variant = await CustomerVariants.findOne({ _id: customer.customerVariant });
                    customerVariantName = variant?.name;
                }
            }

            const pipeline: any[] = [
                { $match: match },
                {
                    $lookup: {
                        from: "wholesalerretailers",
                        localField: "placedBy",
                        foreignField: "_id",
                        as: "wholesalerInfo"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "placedBy",
                        foreignField: "_id",
                        as: "userInfo"
                    }
                },
                {
                    $addFields: {
                        placedByName: {
                            $cond: {
                                if: {
                                    $in: ["$placedByModel", ["Wholesaler", "Retailer"]]
                                },
                                then: {
                                    $arrayElemAt: [
                                        "$wholesalerInfo.name",
                                        0
                                    ]
                                },
                                else: {
                                    $arrayElemAt: ["$userInfo.name", 0]
                                }
                            }
                        }
                    }
                },
                // Get user/wholesaler/retailer details for pricing
                {
                    $lookup: {
                        from: "wholesalerretailers",
                        localField: "placedBy",
                        foreignField: "_id",
                        as: "placedByDetails"
                    }
                },
                {
                    $addFields: {
                        placedByDetail: { $arrayElemAt: ["$placedByDetails", 0] },
                        // Check if this is a wholesaler/retailer order
                        isBusinessOrder: {
                            $in: ["$placedByModel", ["Wholesaler", "Retailer"]]
                        }
                    }
                },
                // Lookup customer variant for the placedBy user
                {
                    $lookup: {
                        from: "customervariants",
                        localField: "placedByDetail.customerVariant",
                        foreignField: "_id",
                        as: "customerVariantDetails"
                    }
                },
                {
                    $addFields: {
                        customerVariantName: {
                            $arrayElemAt: ["$customerVariantDetails.name", 0]
                        }
                    }
                },
                // Lookup product details for each item with attribute details
                {
                    $unwind: {
                        path: "$items",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        let: { productId: "$items.productId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
                            {
                                $lookup: {
                                    from: "brands",
                                    localField: "brand",
                                    foreignField: "_id",
                                    as: "brandDtls"
                                }
                            },
                            {
                                $lookup: {
                                    from: "categories",
                                    localField: "categoryId",
                                    foreignField: "_id",
                                    as: "categoryIdDetails"
                                }
                            },
                            {
                                $lookup: {
                                    from: "subcategories",
                                    localField: "subCategory",
                                    foreignField: "_id",
                                    as: "subCategoryDetails"
                                }
                            },
                            {
                                $lookup: {
                                    from: "childcategories",
                                    localField: "childCategory",
                                    foreignField: "_id",
                                    as: "childCategoryDetails"
                                }
                            },
                            {
                                $lookup: {
                                    from: "attributes",
                                    localField: "wholesalerAttribute.attributeId",
                                    foreignField: "_id",
                                    as: "wholesalerAttributeDetails"
                                }
                            },
                            {
                                $lookup: {
                                    from: "attributes",
                                    localField: "customerAttribute.attributeId",
                                    foreignField: "_id",
                                    as: "customerAttributeDetails"
                                }
                            },
                            {
                                $lookup: {
                                    from: "admins",
                                    localField: "createdBy",
                                    foreignField: "_id",
                                    as: "createdBy"
                                }
                            },
                            {
                                $lookup: {
                                    from: "admins",
                                    localField: "modifiedBy",
                                    foreignField: "_id",
                                    as: "modifiedBy"
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    productCode: 1,
                                    isActive: 1,
                                    isDelete: 1,
                                    productName: 1,
                                    shortDescription: 1,
                                    productImage: 1,
                                    additionalImage: 1,
                                    lowStockAlert: 1,
                                    lowStockQuantity: 1,
                                    tagAndLabel: 1,
                                    refundable: 1,
                                    productStatus: 1,
                                    description: 1,
                                    applicableForWholesale: 1,
                                    wholesalerDiscount: 1,
                                    wholesalerTax: 1,
                                    applicableForCustomer: 1,
                                    customerDiscount: 1,
                                    customerTax: 1,
                                    wholesalerAttribute: 1,
                                    customerAttribute: 1,
                                    metaTitle: 1,
                                    metaKeyword: 1,
                                    metaDesc: 1,
                                    delivery: 1,
                                    createdBy: { $arrayElemAt: ["$createdBy.name", 0] },
                                    modifiedBy: { $arrayElemAt: ["$modifiedBy.name", 0] },
                                    categoryName: { $arrayElemAt: ["$categoryIdDetails.name", 0] },
                                    subCategoryName: { $arrayElemAt: ["$subCategoryDetails.name", 0] },
                                    childCategoryName: { $arrayElemAt: ["$childCategoryDetails.name", 0] },
                                    brandName: { $arrayElemAt: ["$brandDtls.name", 0] },
                                    wholesalerAttributeDetails: 1,
                                    customerAttributeDetails: 1,
                                    hsn: 1,
                                    isIncentive: 1,
                                    packingType: 1,
                                    quantityPerPack: 1,
                                    showToLineman: 1
                                }
                            }
                        ],
                        as: "productDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$productDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Adjust price based on customer variant
                {
                    $addFields: {
                        // Get the variant ID from item attributes
                        "items.variantId": {
                            $let: {
                                vars: {
                                    attrEntries: { $objectToArray: "$items.attributes" }
                                },
                                in: { $arrayElemAt: ["$$attrEntries.v", 0] }
                            }
                        },
                        // Adjust wholesalerAttribute price based on customer variant
                        "productDetails.wholesalerAttribute": {
                            $cond: {
                                if: "$isBusinessOrder",
                                then: {
                                    attributeId: "$productDetails.wholesalerAttribute.attributeId",
                                    rowData: {
                                        $map: {
                                            input: "$productDetails.wholesalerAttribute.rowData",
                                            as: "variant",
                                            in: {
                                                $mergeObjects: [
                                                    "$$variant",
                                                    {
                                                        price: {
                                                            $switch: {
                                                                branches: [
                                                                    {
                                                                        case: { $eq: ["$customerVariantName", "Gold"] },
                                                                        then: {
                                                                            $ifNull: ["$$variant.gold", "$$variant.price"]
                                                                        }
                                                                    },
                                                                    {
                                                                        case: { $eq: ["$customerVariantName", "Silver"] },
                                                                        then: {
                                                                            $ifNull: ["$$variant.silver", "$$variant.price"]
                                                                        }
                                                                    },
                                                                    {
                                                                        case: { $eq: ["$customerVariantName", "Platinum"] },
                                                                        then: {
                                                                            $ifNull: ["$$variant.platinum", "$$variant.price"]
                                                                        }
                                                                    }
                                                                ],
                                                                default: "$$variant.price"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                else: "$productDetails.wholesalerAttribute"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        doc: { $first: "$$ROOT" },
                        items: {
                            $push: {
                                item: "$items",
                                product: "$productDetails"
                            }
                        }
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: ["$doc", { items: "$items" }]
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                { $skip: skip },
                { $limit: limit },
            ];

            // If we have customerVariantName from the userId (not the order's placedBy), 
            // we need to apply it at the final stage
            if (customerVariantName) {
                pipeline.push({
                    $addFields: {
                        items: {
                            $map: {
                                input: "$items",
                                as: "item",
                                in: {
                                    item: "$$item.item",
                                    product: {
                                        $mergeObjects: [
                                            "$$item.product",
                                            {
                                                wholesalerAttribute: {
                                                    attributeId: "$$item.product.wholesalerAttribute.attributeId",
                                                    rowData: {
                                                        $map: {
                                                            input: "$$item.product.wholesalerAttribute.rowData",
                                                            as: "variant",
                                                            in: {
                                                                $mergeObjects: [
                                                                    "$$variant",
                                                                    {
                                                                        price: {
                                                                            $switch: {
                                                                                branches: [
                                                                                    {
                                                                                        case: { $eq: [customerVariantName, "Gold"] },
                                                                                        then: {
                                                                                            $ifNull: ["$$variant.gold", "$$variant.price"]
                                                                                        }
                                                                                    },
                                                                                    {
                                                                                        case: { $eq: [customerVariantName, "Silver"] },
                                                                                        then: {
                                                                                            $ifNull: ["$$variant.silver", "$$variant.price"]
                                                                                        }
                                                                                    },
                                                                                    {
                                                                                        case: { $eq: [customerVariantName, "Platinum"] },
                                                                                        then: {
                                                                                            $ifNull: ["$$variant.platinum", "$$variant.price"]
                                                                                        }
                                                                                    }
                                                                                ],
                                                                                default: "$$variant.price"
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const data = await HoldOrderModel.aggregate(pipeline);
            const total = await HoldOrderModel.countDocuments(match);
            console.log('HoldOrder list data:', data);
            console.log('HoldOrder list total:', total);
            return Pagination(total, data, limit, page);
        } catch (err: any) {
            console.error('HoldOrder list error:', err);
            return createErrorResponse('Failed to fetch hold orders', StatusCodes.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    async update(id: string, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const order = await HoldOrderModel.findOne({ _id: new Types.ObjectId(id), isActive: true, isDelete: false });
            if (!order) {
                return createErrorResponse('Hold order not found', StatusCodes.NOT_FOUND, 'Order does not exist');
            }

            // Soft-delete
            order.isDelete = true;
            order.isActive = false;
            order.updatedAt = new Date();
            order.modifiedBy = new Types.ObjectId(userId);
            order.updatedAt = new Date();
            await order.save();

            return successResponse('Hold order retrieved successfully', StatusCodes.OK, order);
        } catch (error: any) {
            return createErrorResponse('Failed to retrieve hold order', StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Unknown error');
        }
    }
}

export function newHoldOrderRepository(): HoldOrderDomainRepository {
    return new HoldOrderRepository();
}
