import { Document, Types } from "mongoose";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import { ProductModel } from "../../../app/model/product";
import SubCategoryModal, { ISubcategory } from "../../../app/model/subcategory"
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { successResponse } from "../../../utils/common/commonResponse";
import { ProductInput, UpdateProductInput } from "../../../api/Request/product";
import { ProductDocument } from "../../../api/response/product.response";
import { ProductDomainRepository, ProductListParams } from "../../../domain/mobile-app/productDomain";
import Attribute from "../../../app/model/attribute";

import { ProductHelper } from "../../../utils/utilsFunctions/product.helper";
import { ReviewModel } from "../../../app/model/review";
import { WishlistModel } from "../../../app/model/wishlist";
import Users from "../../../app/model/user";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import CustomerVariants from "../../../app/model/customerVariant";
class ProductRepository implements ProductDomainRepository {

    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }

    async findTopRatedProduct(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
        try {

            const { limit, page, fromDate, toDate, type, orderType } = params;

            const pipeline: any = []

            if (fromDate && toDate && orderType == 'topOrder') {
                pipeline.push({
                    $match: {
                        $and: [{ fromDate: { $gte: new Date(fromDate + "T00:00:00.000Z") } }, { toDate: { $lte: new Date(toDate + "T23:59:59.999Z") } }]
                    }
                })

                pipeline.push({
                    $lookup: {
                        from: 'orders',
                        let: { productId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$$productId', '$items.productId']
                                    }
                                }
                            },
                            {
                                $unwind: '$items'
                            },
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$productId', '$items.productId']
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: '$items.productId',
                                    countOrder: { $sum: 1 }
                                }
                            }
                        ],
                        as: 'orderDtls'
                    }
                },
                    {
                        $sort: { orderCount: -1 }
                    })
            }


            pipeline.push({
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
                        from: 'brands',
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDtls'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'categoryIdDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'subcategories',
                        localField: 'subCategory',
                        foreignField: '_id',
                        as: 'subCategoryDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'childcategories',
                        localField: 'childCategory',
                        foreignField: '_id',
                        as: 'childCategoryDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'attributes',
                        localField: 'wholesalerAttribute.attributeId',
                        foreignField: '_id',
                        as: 'wholesalerAttributeDetails'
                    }
                },

                {
                    $lookup: {
                        from: 'attributes',
                        localField: 'customerAttribute.attributeId',
                        foreignField: '_id',
                        as: 'customerAttributeDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendorDtls'
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'reviewRating',
                        pipeline: [
                            {
                                $group: {
                                    _id: '$productId',
                                    totalRating: { $sum: '$rating' },
                                    avgRating: { $avg: '$rating' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        orderCount: { $ifNull: [{ $arrayElemAt: ["$orderDtls.countOrder", 0] }, 0] }
                    }
                },
                {
                    $unwind: {
                        path: '$reviewRating',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$totalRating',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$reviewRating',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        totalRating: { $ifNull: ['$reviewRating.totalRating', 0] },
                        averageRating: { $ifNull: ['$reviewRating.avgRating', 0] },
                        totalReviews: { $ifNull: ['$reviewRating.count', 0] }
                    }
                },
                {
                    $match: {
                        averageRating: { $gt: 0 }
                    }
                },
                {
                    $project: {
                        categoryId: 1,
                        subCategory: 1,
                        childCategory: 1,
                        productCode: 1,
                        isActive: 1,
                        isDelete: 1,
                        productName: 1,
                        shortDescription: 1,
                        productImage: 1,
                        additionalImage: 1,
                        lowStockAlert: 1,
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
                        quantityPerPack: 1,
                        packingType: 1,
                        isIncentive: 1,
                        showToLineman: 1,
                        wholesalerAttribute: 1,
                        customerAttribute: 1,
                        metaTitle: 1,
                        metaKeyword: 1,
                        metaDesc: 1,
                        delivery: 1,
                        vendorId: 1,
                        createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
                        modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
                        categoryName: { $arrayElemAt: ['$categoryIdDetails.name', 0] },
                        subCategoryName: { $arrayElemAt: ['$subCategoryDetails.name', 0] },
                        childCategoryName: { $arrayElemAt: ['$childCategoryDetails.name', 0] },
                        wholesalerAttributeDetails: 1,
                        customerAttributeDetails: 1,
                        brandName: { $arrayElemAt: ['$brandDtls.name', 0] },
                        vendorName: { $arrayElemAt: ['$vendorDtls.name', 0] },
                        _id: 1,
                        totalRating: 1,
                        averageRating: 1,
                        totalReviews: 1,
                        orderCount: 1
                    }
                })
            if (orderType == 'toprated') {
                pipeline.push({ $sort: { averageRating: -1 } })
            }

            if (limit > 0) {
                pipeline.push(
                    { $skip: +page * limit },
                    { $limit: limit }
                );
            }

            const products = await ProductModel.aggregate(pipeline);

            const result = []
            for (const element of products) {

                const productDtls: any = {
                    _id: element._id,
                    productCode: element.productCode,
                    isActive: element.isActive ?? "",
                    isDelete: element.isDelete ?? "",
                    productName: element.productName ?? "",
                    shortDescription: element.shortDescription ?? "",
                    productImage: element.productImage ?? "",
                    additionalImage: element.additionalImage ?? "",
                    lowStockAlert: element.lowStockAlert ?? "",
                    tagAndLabel: element.tagAndLabel ?? "",
                    refundable: element.refundable ?? "",
                    productStatus: element.productStatus ?? "",
                    description: element.description ?? "",
                    applicableForWholesale: element.applicableForWholesale ?? "",
                    wholesalerDiscount: element.wholesalerDiscount ?? "",
                    wholesalerTax: element.wholesalerTax ?? "",
                    applicableForCustomer: element.applicableForCustomer ?? "",
                    customerDiscount: element.customerDiscount ?? "",
                    customerTax: element.customerTax ?? "",

                    metaTitle: element.metaTitle ?? "",
                    metaKeyword: element.metaKeyword ?? "",
                    metaDesc: element.metaDesc ?? "",
                    delivery: element.delivery ?? "",
                    vendorId: element.vendorId ?? "",
                    createdBy: element.createdBy ?? "",
                    modifiedBy: element.modifiedBy ?? "",
                    categoryIdDetails: element.categoryIdDetails ?? "",
                    subCategoryDetails: element.subCategoryDetails ?? "",
                    childCategoryDetails: element.childCategoryDetails ?? "",
                    brandName: element.brandName ?? "",
                    vendorName: element.vendorName ?? "",
                    wholesalerAttributeDetails: [],
                    customerAttributeDetails: [],
                    totalRating: element.totalRating,
                    rating: element.averageRating,
                    totalReviews: element.totalReviews
                };

                if (params.type == 'customer') {

                    const rowDataCustomer = element?.customerAttribute?.rowData || [];
                    const attributeDetailsCustomer = element?.customerAttributeDetails || [];
                    const attributeIds = (element?.customerAttribute?.attributeId || []).map((id: any) => id.toString()); // First index is top-level attribute ID

                    productDtls.customerAttributeDetails = ProductHelper.buildAttributeTree(
                        attributeDetailsCustomer,
                        rowDataCustomer,
                        attributeIds,
                        0,                // level
                        undefined,        // parentAttrName
                        undefined,        // parentAttrValue
                        undefined,        // parentId
                        element.customerTax
                    );

                } else if (params.type == 'wholesaler') {
                    const rowDataCustomer = element?.wholesalerAttribute?.rowData || [];
                    const attributeDetailsCustomer = element?.wholesalerAttributeDetails || [];
                    const attributeIds = (element?.wholesalerAttribute?.attributeId || []).map((id: any) => id.toString()); // First index is top-level attribute ID

                    productDtls.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                        attributeDetailsCustomer,
                        rowDataCustomer,
                        attributeIds,
                        0,                // level
                        undefined,        // parentAttrName
                        undefined,        // parentAttrValue
                        undefined,        // parentId
                        0
                    );
                }

                result.push(productDtls)
            }

            return Pagination(0, result, limit, page);
        } catch (error: any) {
            return createErrorResponse(
                'Error product top rated',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async findSlugExistForEdit(name: string, id: string): Promise<{ count: number; statusCode: number; } | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({ _id: { $ne: new Types.ObjectId(id) }, slug: name, isActive: true, isDelete: false });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking product name',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findSlugExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({ slug: name, isActive: true, isDelete: false });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking product name',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findProductNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse> {
        try {
            const count = await ProductModel.countDocuments({
                _id: { $ne: new Types.ObjectId(id) },
                productName: name,
                isActive: true,
                isDelete: false
            });
            return { count, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse(
                'Error checking product name',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async create(product: ProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {

            const productDoc = new ProductModel({
                ...product,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),

            });

            await productDoc.save()

            return successResponse("Product created successfully", StatusCodes.OK, { message: '' });
        } catch (error: any) {
            return createErrorResponse(
                'Error creating product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async update(id: string, product: UpdateProductInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const updatedProduct = await ProductModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), isActive: true, isDelete: false },
                {
                    $set: {
                        ...product,
                        modifiedBy: new Types.ObjectId(userId),
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            if (!updatedProduct) {
                return createErrorResponse(
                    'Product not found',
                    StatusCodes.NOT_FOUND,
                    'Product with given ID not found'
                );
            }

            const result: SuccessMessage = {
                message: 'Product update success.'
            };
            return successResponse("Product updated successfully", StatusCodes.OK, result);

        } catch (error: any) {
            return createErrorResponse(
                'Error updating product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getById(id: string): Promise<ApiResponse<ProductDocument> | ErrorResponse> {
        try {
            const product = await ProductModel.findOne({
                _id: new Types.ObjectId(id),
                isActive: true,
                isDelete: false
            }).populate('createdBy', 'name').populate('modifiedBy', 'name');

            if (!product) {
                return createErrorResponse(
                    'Product not found',
                    StatusCodes.NOT_FOUND,
                    'Product with given ID not found'
                );
            }

            const rawData = product
            const responseData: any = {
                _id: rawData._id.toString(),
                categoryId: rawData.categoryId.toString(),
                subCategory: rawData.subCategory.toString(),
                childCategory: rawData.childCategory
                    ? rawData.childCategory.toString()
                    : "",
                productName: rawData.productName,
                brand: rawData.brand,
                shortDescription: rawData.shortDescription,
                slug: rawData.slug,
                productImage: rawData.productImage,
                additionalImage: rawData.additionalImage ?? [],
                lowStockAlert: rawData.lowStockAlert,
                tagAndLabel: rawData.tagAndLabel,
                refundable: rawData.refundable,
                productStatus: rawData.productStatus,
                description: rawData.description,
                applicableForWholesale: rawData.applicableForWholesale,
                createdBy: rawData.createdBy?.toString() || '',
                modifiedBy: rawData.modifiedBy?.toString() || '',
                isActive: rawData.isActive,
                isDelete: rawData.isDelete,
                createdAt: rawData.createdAt,
                updatedAt: rawData.updatedAt
            };

            return {
                status: 'success',
                statusCode: StatusCodes.OK,
                message: 'Product retrieved successfully',
                data: responseData
            };
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving product',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async list(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
        try {
            const pipeline: any[] = [];
            let ratings;
            let wishList: any;
            const user: any = await WholesalerRetailsers.findOne({ _id: params.userId !== '' ? new Types.ObjectId(params.userId) : undefined });
            const role = params.type !== 'customer' ? await CustomerVariants.findOne({
                _id: new Types.ObjectId(user?.customerVariant)
            }) : undefined;
            const { childCategoryId, limit, categoryId, subCategoryId, sortBy, order, page, type, id, priceFromRange, priceToRange, orderId, userId, orderType,
                ratingFrom, ratingTo
            } = params;
            pipeline.push({ $match: { isActive: true, isDelete: false } });


            // filter
            if (id) {
                pipeline.push({ $match: { _id: new Types.ObjectId(id) } });
            }
            if (categoryId) {
                const ids = categoryId.split(',').map((id) => new Types.ObjectId(id));
                pipeline.push({ $match: { categoryId: { $in: ids } } });
            }
            if (subCategoryId) {
                const ids = subCategoryId.split(',').map((id) => new Types.ObjectId(id));
                pipeline.push({ $match: { subCategory: { $in: ids } } });

                // pipeline.push({ $match: { subCategory: new ObjectId(subCategoryId) } });
            }
            if (childCategoryId) {
                const ids = childCategoryId.split(',').map((id) => new Types.ObjectId(id));

                pipeline.push({ $match: { childCategory: { $in: ids } } });
                // pipeline.push({ $match: { childCategory: new ObjectId(childCategoryId) } });
            }
            if (priceFromRange && priceToRange > '0' && (type === 'customer' || type === 'retailer')) {
                const priceStartArr = priceFromRange.split(',').map(Number);
                const priceEndArr = priceToRange.split(',').map(Number);

                const customerPriceFilters = [];
                for (let i = 0; i < priceStartArr.length; i++) {
                    customerPriceFilters.push({
                        "customerAttribute.rowData": {
                            $elemMatch: {
                                numericPrice: {
                                    $gte: priceStartArr[i],
                                    $lte: priceEndArr[i]
                                }
                            }
                        }
                    });
                }

                // Step 1: Convert `price` to number inside `customerAttribute.rowData`
                pipeline.push({
                    $addFields: {
                        "customerAttribute.rowData": {
                            $map: {
                                input: "$customerAttribute.rowData",
                                as: "item",
                                in: {
                                    $mergeObjects: [
                                        "$$item",
                                        {
                                            numericPrice: { $toDouble: "$$item.price" }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                });

                // Step 2: Apply price range filter
                pipeline.push({
                    $match: {
                        $or: customerPriceFilters
                    }
                });
            }
            if (priceFromRange && priceToRange > '0' && type === 'wholesaler') {
                const priceStartArr = priceFromRange.split(',').map(Number);
                const priceEndArr = priceToRange.split(',').map(Number);

                const customerPriceFilters = [];

                for (let i = 0; i < priceStartArr.length; i++) {
                    customerPriceFilters.push({
                        "wholesalerAttribute.rowData": {
                            $elemMatch: {
                                numericPrice: {
                                    $gte: priceStartArr[i],
                                    $lte: priceEndArr[i]
                                }
                            }
                        }
                    });
                }

                // Step 1: Convert `price` to number inside `customerAttribute.rowData`
                pipeline.push({
                    $addFields: {
                        "wholesalerAttribute.rowData": {
                            $map: {
                                input: "$wholesalerAttribute.rowData",
                                as: "item",
                                in: {
                                    $mergeObjects: [
                                        "$$item",
                                        {
                                            numericPrice: { $toDouble: "$$item.price" }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                });

                // Step 2: Apply price range filter
                pipeline.push({
                    $match: {
                        $or: customerPriceFilters
                    }
                });
            }

            if (orderType === 'order') {
                pipeline.push(
                    {
                        $lookup: {
                            from: 'orders',
                            let: { productId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$placedBy', new Types.ObjectId(userId)] },
                                                { $in: ['$$productId', '$items.productId'] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'orderDtls'
                        }
                    },
                    {
                        $match: {
                            orderDtls: { $ne: [] }
                        }
                    }
                );
            }

            pipeline.push({
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
                        from: 'brands',
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDtls'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'categoryIdDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'subcategories',
                        localField: 'subCategory',
                        foreignField: '_id',
                        as: 'subCategoryDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'childcategories',
                        localField: 'childCategory',
                        foreignField: '_id',
                        as: 'childCategoryDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'attributes',
                        localField: 'wholesalerAttribute.attributeId',
                        foreignField: '_id',
                        as: 'wholesalerAttributeDetails'
                    }
                },

                {
                    $lookup: {
                        from: 'attributes',
                        localField: 'customerAttribute.attributeId',
                        foreignField: '_id',
                        as: 'customerAttributeDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendorDtls'
                    }
                },
                {
                    $lookup: {
                        from: 'offers',
                        localField: '_id',
                        foreignField: 'productId.id',
                        as: 'offers'
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'reviewRating',
                        pipeline: [
                            {
                                $group: {
                                    _id: '$productId',
                                    totalRating: { $sum: '$rating' },
                                    avgRating: { $avg: '$rating' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: '$reviewRating',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$totalRating',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$reviewRating',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        totalRating: { $ifNull: ['$reviewRating.totalRating', 0] },
                        averageRating: { $ifNull: ['$reviewRating.avgRating', 0] },
                        totalReviews: { $ifNull: ['$reviewRating.count', 0] }
                    }
                },
                {
                    $project: {
                        categoryId: 1,
                        subCategory: 1,
                        childCategory: 1,
                        productCode: 1,
                        isActive: 1,
                        isDelete: 1,
                        productName: 1,
                        shortDescription: 1,
                        productImage: 1,
                        additionalImage: 1,
                        lowStockAlert: 1,
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
                        vendorId: 1,
                        createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
                        modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
                        categoryIdDetails: 1,
                        subCategoryDetails: 1,
                        childCategoryDetails: 1,
                        categoryName: { $ifNull: [{ $arrayElemAt: ['$categoryIdDetails.name', 0] }, ''] },
                        subCategoryName: { $ifNull: [{ $arrayElemAt: ['$subCategoryDetails.name', 0] }, ''] },
                        childCategoryName: { $ifNull: [{ $arrayElemAt: ['$childCategoryDetails.name', 0] }, ''] },
                        wholesalerAttributeDetails: 1,
                        customerAttributeDetails: 1,
                        brandName: { $ifNull: [{ $arrayElemAt: ['$brandDtls.name', 0] }, ''] },
                        vendorName: { $ifNull: [{ $arrayElemAt: ['$vendorDtls.name', 0] }, ''] },
                        _id: 1,
                        totalRating: 1,
                        averageRating: 1,
                        totalReviews: 1,
                        offers: 1,
                        as_568a_standard: 1,
                        jis_b_2401_standard: 1
                    }
                })
            if (sortBy !== '') {
                const sortFields = sortBy.split(',');
                const sortOrders = order?.split(',') || [];

                const sortObj: Record<string, 1 | -1> = {};

                sortFields.forEach((field, index) => {
                    const dir = sortOrders[index] || 'asc';
                    const sortDirection = dir === 'desc' ? -1 : 1;

                    if (field.includes('customerAttribute.rowData.price')) {
                        // Add conversion stage if not already present
                        if (!pipeline.some(stage => stage.$addFields?.firstCustomerPrice)) {
                            pipeline.push({
                                $addFields: {
                                    firstCustomerPrice: {
                                        $toDouble: {
                                            $arrayElemAt: [
                                                "$customerAttribute.rowData.price",
                                                0
                                            ]
                                        }
                                    }
                                }
                            });
                        }
                        sortObj["firstCustomerPrice"] = sortDirection;
                    }
                    else if (field.includes('wholesalerAttribute.rowData.price')) {
                        // Add conversion stage if not already present
                        if (!pipeline.some(stage => stage.$addFields?.firstWholesalerPrice)) {
                            pipeline.push({
                                $addFields: {
                                    firstWholesalerPrice: {
                                        $toDouble: {
                                            $arrayElemAt: [
                                                "$wholesalerAttribute.rowData.price",
                                                0
                                            ]
                                        }
                                    }
                                }
                            });
                        }
                        sortObj["firstWholesalerPrice"] = sortDirection;
                    }
                    else {
                        sortObj[field] = sortDirection;
                    }
                });

                pipeline.push({ $sort: sortObj });
            } else {
                pipeline.push({ $sort: { createdAt: -1 } });
            }

            if (params?.search !== '') {
                const searchRegex = { $regex: params.search, $options: 'i' };

                pipeline.push({
                    $match: {
                        $or: [
                            { productName: searchRegex },
                            { "categoryName": searchRegex },
                            { 'subCategoryName': searchRegex }
                            // Add more fields as needed
                        ]
                    }
                });
            }
            if (ratingFrom && ratingTo && ratingTo > '0') {
                const ratingStartArr = ratingFrom.split(',').map(Number);
                const ratingEndArr = ratingTo.split(',').map(Number);

                const ratingConditions = [];

                for (let i = 0; i < ratingStartArr.length; i++) {
                    ratingConditions.push({
                        averageRating: {
                            $gte: ratingStartArr[i],
                            $lte: ratingEndArr[i]
                        }
                    });
                }

                pipeline.push({
                    $match: {
                        $or: ratingConditions
                    }
                });

            }
            // Based on orderId
            if (orderId) {
                ratings = await ReviewModel.findOne({ orderId: new Types.ObjectId(order), userId: new Types.ObjectId(userId), productId: new Types.ObjectId(id), isActive: 1, isDelete: 0 })
            }
            // const count = await ProductModel.countDocuments(countFilter);
            const countResult = await ProductModel.aggregate([
                ...pipeline,
                { $count: "total" }
            ]);

            const totalCount = countResult[0]?.total || 0;
            if (limit > 0) {

                pipeline.push(
                    { $skip: +page * +limit },
                    { $limit: +limit }
                );
            }
            const products = await ProductModel.aggregate(pipeline);

            const result = []
            for (const element of products) {
                if (userId) {

                    wishList = await WishlistModel.findOne({
                        userId: new Types.ObjectId(userId),
                        "products.productId": new Types.ObjectId(element._id),
                        isActive: true,
                        isDelete: false
                    });
                }
                const firstOffer = element?.offers?.[0];

                const offerDiscount = firstOffer?.discount || 0;
                const offerId = firstOffer?._id || '';
                const offerType = firstOffer
                    ? firstOffer.offerType === 'package' && params.type !== 'customer'
                        ? 'no'
                        : firstOffer.offerType
                    : 'no';

                const productDtls: any = {
                    _id: element._id,
                    productCode: element.productCode,
                    isActive: element.isActive ?? "",
                    isDelete: element.isDelete ?? "",
                    productName: element.productName ?? "",
                    shortDescription: element.shortDescription ?? "",
                    productImage: element.productImage ?? "",
                    additionalImage: element.additionalImage ?? "",
                    lowStockAlert: element.lowStockAlert ?? "",
                    tagAndLabel: element.tagAndLabel ?? "",
                    refundable: element.refundable ?? "",
                    productStatus: element.productStatus ?? "",
                    description: element.description ?? "",
                    applicableForWholesale: element.applicableForWholesale ?? "",
                    wholesalerDiscount: element.wholesalerDiscount ?? "",
                    wholesalerTax: element.wholesalerTax ?? "",
                    applicableForCustomer: element.applicableForCustomer ?? "",
                    customerDiscount: element.customerDiscount ?? "",
                    customerTax: element.customerTax ?? "",
                    metaTitle: element.metaTitle ?? "",
                    metaKeyword: element.metaKeyword ?? "",
                    metaDesc: element.metaDesc ?? "",
                    delivery: element.delivery ?? "",
                    vendorId: element.vendorId ?? "",
                    createdBy: element.createdBy ?? "",
                    modifiedBy: element.modifiedBy ?? "",
                    categoryIdDetails: element.categoryIdDetails ?? "",
                    subCategoryDetails: element.subCategoryDetails ?? "",
                    childCategoryDetails: element.childCategoryDetails ?? "",
                    brandName: element.brandName ?? "",
                    vendorName: element.vendorName ?? "",
                    wholesalerAttributeDetails: [],
                    customerAttributeDetails: [],
                    productRating: ratings ? true : false,
                    wishList: wishList ? true : false,
                    totalRating: element.totalRating,
                    rating: element.averageRating,
                    totalReviews: element.totalReviews,
                    offers: element.offers,
                    offerType,
                    offerId,
                    offerDiscount,
                    as_568a_standard: element.as_568a_standard ?? [],
                    jis_b_2401_standard: element.jis_b_2401_standard ?? []
                };

                if (params.type == 'customer' || params.type == 'retailer') {

                    const rowDataCustomer = element?.customerAttribute?.rowData || [];
                    const attributeDetailsCustomer = element?.customerAttributeDetails || [];
                    const attributeIds = (element?.customerAttribute?.attributeId || []).map((id: any) => id.toString()); // First index is top-level attribute ID

                    productDtls.customerAttributeDetails = ProductHelper.buildAttributeTree(
                        attributeDetailsCustomer,
                        rowDataCustomer,
                        attributeIds,
                        0,                // level
                        undefined,        // parentAttrName
                        undefined,        // parentAttrValue
                        undefined,        // parentId
                        element.customerTax,  // tax
                        role?.name ?? 'customer'
                    );

                } else if (params.type == 'wholesaler') {
                    const rowDataCustomer = element?.wholesalerAttribute?.rowData || [];
                    const attributeDetailsCustomer = element?.wholesalerAttributeDetails || [];
                    const attributeIds = (element?.wholesalerAttribute?.attributeId || []).map((id: any) => id.toString()); // First index is top-level attribute ID

                    productDtls.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                        attributeDetailsCustomer,
                        rowDataCustomer,
                        attributeIds,
                        0,                // level
                        undefined,        // parentAttrName
                        undefined,        // parentAttrValue
                        undefined,        // parentId
                        0,
                        role?.name ?? 'customer'

                    );
                }

                result.push(productDtls)
            }

            return Pagination(totalCount, result, limit, page);

        } catch (error: any) {
            console.log(error);

            return createErrorResponse(
                'Error retrieving products',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
    async enrichAttributeData(attributeData: any) {
        if (!attributeData?.rowData || attributeData.rowData.length === 0) {
            return attributeData;
        }

        const attributeValueIds = new Set<string>();

        // Collect all attribute value IDs from rowData
        attributeData.rowData.forEach((row: any) => {
            Object.entries(row).forEach(([key, value]) => {
                if (
                    key !== 'sku' &&
                    key !== 'price' &&
                    key !== 'stock' &&
                    key !== 'maxLimit' &&
                    typeof value === 'string'
                ) {
                    attributeValueIds.add(value);
                }
            });
        });

        const attributeValueIdArray = [...attributeValueIds].map(id => new Types.ObjectId(id));

        const attributeValues = await Attribute.find({
            "value._id": { $in: attributeValueIdArray }
        });

        // Create a mapping from value ID to value object
        const attributeValueMap: Record<string, any> = {};
        for (const attr of attributeValues) {
            for (const val of attr.value) {
                attributeValueMap[val._id.toString()] = {
                    ...val.toObject?.() ?? val,
                    attributeId: attr._id.toString()
                };
            }
        }
        // Enrich rowData with corresponding details
        const enrichedRowData = attributeData.rowData.map((row: any) => {
            const enrichedRow = { ...row, count: 0 };
            const enrichedAttributes: { name: string; value: string; attributeId: string }[] = [];

            Object.entries(row).forEach(([key, value]) => {
                const valueStr = String(value);
                const detail = attributeValueMap[valueStr];

                if (detail) {
                    // Add details like SizeDetails, ColorDetails etc.
                    enrichedRow[`${key}Details`] = detail;

                    // Push to enrichedAttributes array
                    enrichedAttributes.push({
                        name: key,
                        value: detail.value,
                        attributeId: detail.attributeId
                    });
                }
            });

            enrichedRow.enrichedAttributes = enrichedAttributes;

            return enrichedRow;
        });
        return {
            ...attributeData,
            rowData: enrichedRowData
        };
    }
    async getProductByCategoryId(
        id: string,
        userId?: string,
        type: "customer" | "wholesaler" = "customer"
    ): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const subCategory = await SubCategoryModal.findById(id);

            if (!subCategory) {
                return createErrorResponse("SubCategory not found", StatusCodes.NOT_FOUND);
            }

            const pipeline: any[] = [
                { $match: { subCategory: new Types.ObjectId(id), isActive: true, isDelete: false } },

                {
                    $lookup: {
                        from: "brands",
                        localField: "brand",
                        foreignField: "_id",
                        as: "brandDtls",
                    }
                },

                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "categoryIdDetails",
                    }
                },

                {
                    $lookup: {
                        from: "subcategories",
                        localField: "subCategory",
                        foreignField: "_id",
                        as: "subCategoryDetails",
                    }
                },

                // ATTRIBUTES (wholesaler + customer)
                {
                    $lookup: {
                        from: "attributes",
                        localField: "customerAttribute.attributeId",
                        foreignField: "_id",
                        as: "customerAttributeDetails",
                    }
                },
                {
                    $lookup: {
                        from: "attributes",
                        localField: "wholesalerAttribute.attributeId",
                        foreignField: "_id",
                        as: "wholesalerAttributeDetails",
                    }
                },

                // OFFERS
                {
                    $lookup: {
                        from: "offers",
                        localField: "_id",
                        foreignField: "productId.id",
                        as: "offers",
                    }
                },

                // REVIEWS
                {
                    $lookup: {
                        from: "reviews",
                        localField: "_id",
                        foreignField: "productId",
                        as: "reviewRating",
                        pipeline: [
                            {
                                $group: {
                                    _id: "$productId",
                                    totalRating: { $sum: "$rating" },
                                    avgRating: { $avg: "$rating" },
                                    count: { $sum: 1 },
                                }
                            }
                        ]
                    }
                },

                { $unwind: { path: "$reviewRating", preserveNullAndEmptyArrays: true } },

                // FINAL FIELDS
                {
                    $addFields: {
                        totalRating: { $ifNull: ["$reviewRating.totalRating", 0] },
                        averageRating: { $ifNull: ["$reviewRating.avgRating", 0] },
                        totalReviews: { $ifNull: ["$reviewRating.count", 0] }
                    }
                }
            ];

            const products = await ProductModel.aggregate(pipeline);

            // BUILD FINAL RESULT FORMAT
            const finalProducts: any[] = [];

            for (const p of products) {
                // WISHLIST CHECK
                let wishList: any = null;
                if (userId) {
                    wishList = await WishlistModel.findOne({
                        userId: new Types.ObjectId(userId),
                        "products.productId": new Types.ObjectId(p._id),
                        isActive: true,
                        isDelete: false,
                    });
                }

                // FIRST OFFER
                const firstOffer = p.offers?.[0];
                const offerDiscount = firstOffer?.discount || 0;
                const offerId = firstOffer?._id || "";
                const offerType =
                    firstOffer && firstOffer.offerType === "package" && type !== "customer"
                        ? "no"
                        : firstOffer?.offerType || "no";

                const product: any = {
                    _id: p._id,
                    productCode: p.productCode,
                    productName: p.productName,
                    productImage: p.productImage,
                    additionalImage: p.additionalImage,
                    description: p.description,
                    brandName: p.brandDtls?.[0]?.name || "",
                    categoryName: p.categoryIdDetails?.[0]?.name || "",
                    subCategoryName: p.subCategoryDetails?.[0]?.name || "",
                    totalRating: p.totalRating,
                    rating: p.averageRating,
                    totalReviews: p.totalReviews,
                    wishList: wishList ? true : false,
                    offers: p.offers,
                    offerType,
                    offerId,
                    offerDiscount,
                    productRating: false,
                    wholesalerAttributeDetails: [],
                    customerAttributeDetails: []
                };

                // CUSTOMER ATTRIBUTES
                if (type === "customer") {
                    const row = p?.customerAttribute?.rowData || [];
                    const attr = p?.customerAttributeDetails || [];
                    const attrIds = (p?.customerAttribute?.attributeId || []).map((x: any) => x.toString());

                    product.customerAttributeDetails = ProductHelper.buildAttributeTree(
                        attr,
                        row,
                        attrIds,
                        0,
                        undefined,
                        undefined,
                        undefined,
                        p.customerTax
                    );
                }

                // WHOLESALER ATTRIBUTES
                if (type === "wholesaler") {
                    const row = p?.wholesalerAttribute?.rowData || [];
                    const attr = p?.wholesalerAttributeDetails || [];
                    const attrIds = (p?.wholesalerAttribute?.attributeId || []).map((x: any) => x.toString());

                    product.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                        attr,
                        row,
                        attrIds,
                        0,
                        undefined,
                        undefined,
                        undefined,
                        0
                    );
                }

                finalProducts.push(product);
            }

            const data = {
                subCategory,
                products: finalProducts,
                totalProducts: finalProducts.length,
            };

            return successResponse("Subcategory & Products Found", StatusCodes.OK, data);

        } catch (err: any) {
            return createErrorResponse(
                err.message,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

}

export function NewProductRepoistory(db: any): ProductDomainRepository {
    return new ProductRepository(db)
}