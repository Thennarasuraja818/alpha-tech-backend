import { Types } from "mongoose";
import { Document } from "mongoose";
import { ProductDomainRepository, ProductListParams } from "../../../domain/admin/productDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import { ProductModel } from "../../../app/model/product";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { successResponse } from "../../../utils/common/commonResponse";
import { ProductInput, UpdateProductInput } from "../../../api/Request/product";
import { ProductDocument } from "../../../api/response/product.response";
import { HistoryModel } from "../../../app/model/history";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import CustomerVariants from "../../../app/model/customerVariant";

class ProductRepository implements ProductDomainRepository {
  private readonly db: any;

  constructor(db: any) {
    this.db = db;
  }
  async findIsProductExist(id: string): Promise<Boolean | ErrorResponse> {
    try {
      const count = await ProductModel.countDocuments({
        _id: new Types.ObjectId(id),
      });

      return count === 1;
    } catch (error: any) {
      return createErrorResponse(
        "Error finding vendor",
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

  async create(product: ProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      console.log(productAddtionalImg, 'productAddtionalImg');

      const count = await ProductModel.countDocuments({
        isActive: true,
        isDelete: false,
      });

      let code = "PDT-";
      const len = count + 1;
      code = code.concat(len.toString().padStart(3, "0"));

      if (product.slug) {
        const slugExists = await ProductModel.findOne({ slug: product.slug });
        if (slugExists) {
          return createErrorResponse(
            'Slug name already exists',
            StatusCodes.CONFLICT,
            'Product with given slug already exists'
          );
        }
      }
      if (product.productName) {
        const nameExists = await ProductModel.findOne({ productName: product.productName });
        if (nameExists) {
          return createErrorResponse(
            'Product name already exists',
            StatusCodes.CONFLICT,
            'Product with given name already exists'
          );
        }
      }

      const productDoc = new ProductModel({
        ...product,
        productImage: productImg,
        additionalImage: productAddtionalImg,
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        productCode: code
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

  async update(id: string, product: UpdateProductInput, userId: string, productImg: any, productAddtionalImg: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const findProduct = await ProductModel.findById({
        _id: new Types.ObjectId(id), isActive: true, isDelete: false
      })
      if (product.slug) {
        const slugExists = await ProductModel.findOne({
          slug: product.slug,
          _id: { $ne: new Types.ObjectId(id) }
        });
        if (slugExists) {
          return createErrorResponse(
            'Slug name already exists',
            StatusCodes.CONFLICT,
            'Product with given slug already exists'
          );
        }
      }
      if (product.productName) {
        const nameExists = await ProductModel.findOne({
          productName: product.productName,
          _id: { $ne: new Types.ObjectId(id) }
        });
        if (nameExists) {
          return createErrorResponse(
            'Product name already exists',
            StatusCodes.CONFLICT,
            'Product with given name already exists'
          );
        }
      }
      const updatedProduct = await ProductModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), isActive: true, isDelete: false },
        {
          $set: {
            ...product,
            productImage: productImg,
            additionalImage: productAddtionalImg,
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

      await HistoryModel.create({
        history: [findProduct],
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId)
      });

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

  async getCurrentStock(): Promise<ApiResponse<ProductDocument[]> | ErrorResponse> {
    try {
      const products = await ProductModel.aggregate([
        {
          $match: {
            isActive: true,
            isDelete: false
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryDtls'
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
          $unwind: {
            path: '$categoryDtls',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$brandDtls',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            productId: { $toString: '$_id' },
            productName: 1,
            categoryId: { $toString: '$categoryId' },
            categoryName: { $ifNull: ['$categoryDtls.name', ''] },
            brand: { $ifNull: ['$brandDtls.name', ''] },
            sku: 1,
            // Get total stock by summing up all variant stock quantities from customerAttribute.rowData
            stockQuantity: {
              $sum: {
                $map: {
                  input: '$customerAttribute.rowData',
                  as: 'row',
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ['$$row.stock', undefined] },
                          { $ne: ['$$row.stock', null] },
                          { $ne: ['$$row.stock', ''] }
                        ]
                      },
                      then: {
                        $toInt: '$$row.stock'
                      },
                      else: 0
                    }
                  }
                }
              }
            },
            status: {
              $cond: {
                if: { $eq: ['$stockQuantity', 0] },
                then: 'Out of Stock',
                else: {
                  $cond: {
                    if: { $eq: ['$lowStockQuantity', 0] },
                    then: 'In Stock',
                    else: {
                      $cond: {
                        if: { $lt: ['$stockQuantity', '$lowStockQuantity'] },
                        then: 'Low Stock',
                        else: 'In Stock'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]);

      return successResponse('Current stock retrieved', StatusCodes.OK, products);
    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving current stock',
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
      });

      if (!product) {
        return createErrorResponse(
          'Product not found',
          StatusCodes.NOT_FOUND,
          'Product with given ID not found'
        );
      }

      const rawData = product
      const responseData: ProductDocument = {
        _id: rawData._id.toString(),
        productCode: rawData.productCode ?? "",
        categoryId: rawData.categoryId.toString(),
        subCategory: rawData.subCategory.toString(),
        childCategory: rawData.childCategory
          ? rawData.childCategory.toString()
          : "",
        productName: rawData.productName,
        hsn: rawData.hsn,
        brand: rawData.brand.toString(),
        shortDescription: rawData.shortDescription,
        slug: rawData.slug,
        productImage: rawData.productImage,
        additionalImage: rawData.additionalImage ?? [],
        lowStockAlert: rawData.lowStockAlert,
        tagAndLabel: rawData.tagAndLabel ?? "",
        refundable: rawData.refundable,
        productStatus: rawData.productStatus,
        description: rawData.description ?? "",
        applicableForWholesale: rawData.applicableForWholesale,
        wholesalerDiscount: rawData.wholesalerDiscount ?? 0,
        wholesalerTax: rawData.wholesalerTax ?? 0,
        applicableForCustomer: rawData.applicableForCustomer,
        customerDiscount: rawData.customerDiscount ?? 0,
        customerTax: rawData.customerTax ?? 0,
        quantityPerPack: rawData.quantityPerPack ?? 0,
        packingType: rawData.packingType ?? "",
        isIncentive: rawData.isIncentive ?? false,
        showToLineman: rawData.showToLineman ?? false,
        wholesalerAttribute: rawData.wholesalerAttribute ?? { attributeId: [], rowData: [] },
        customerAttribute: rawData.customerAttribute ?? { attributeId: [], rowData: [] },
        metaTitle: rawData.metaTitle ?? "",
        metaKeyword: rawData.metaKeyword ?? "",
        metaDesc: rawData.metaDesc ?? "",
        delivery: rawData.delivery ?? "",
        lowStockQuantity: rawData.lowStockQuantity ?? 20,
        // vendorId: rawData.vendorId?.toString() ?? "",
        createdBy: rawData.createdBy?.toString() || "",
        modifiedBy: rawData.modifiedBy?.toString() || "",
        as_568a_standard: rawData.as_568a_standard,
        jis_b_2401_standard: rawData.jis_b_2401_standard,
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
      const { page = 0, limit = 10, type, search, categoryId, stockType } = params;

      // Base match stage
      const matchStage: any = {
        isActive: true,
        isDelete: false,
      };

      // Add search filter if provided
      // if (search) {
      //   matchStage.$or = [
      //     { productName: { $regex: search, $options: 'i' } },
      //     { productCode: { $regex: search, $options: 'i' } },
      //     { 'brandDtls.name': { $regex: search, $options: 'i' } },
      //     { 'categoryIdDetails.name': { $regex: search, $options: 'i' } },
      //     { 'subCategoryDetails.name': { $regex: search, $options: 'i' } },
      //   ];
      // }

      // Add category filter if provided
      if (categoryId) {
        matchStage.categoryId = { $in: categoryId.split(',').map((val) => new Types.ObjectId(val)) };
      }

      const pipeline: any[] = [
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandDtls',
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryIdDetails',
          },
        },
        {
          $lookup: {
            from: 'subcategories',
            localField: 'subCategory',
            foreignField: '_id',
            as: 'subCategoryDetails',
          },
        },
        {
          $lookup: {
            from: 'childcategories',
            localField: 'childCategory',
            foreignField: '_id',
            as: 'childCategoryDetails',
          },
        },
        {
          $lookup: {
            from: 'attributes',
            localField: 'wholesalerAttribute.attributeId',
            foreignField: '_id',
            as: 'wholesalerAttributeDetails',
          },
        },
        {
          $lookup: {
            from: 'attributes',
            localField: 'customerAttribute.attributeId',
            foreignField: '_id',
            as: 'customerAttributeDetails',
          },
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'modifiedBy',
            foreignField: '_id',
            as: 'modifiedBy',
          },
        },
        {
          $lookup: {
            from: 'offers',
            localField: '_id',
            foreignField: 'productId.id',
            as: 'offers',
          },
        },
        ...(search ? [{
          $match: {
            $or: [
              { productName: { $regex: search, $options: 'i' } },
              { productCode: { $regex: search, $options: 'i' } },
              { 'brandDtls.name': { $regex: search, $options: 'i' } },
              { 'categoryIdDetails.name': { $regex: search, $options: 'i' } },
              { 'subCategoryDetails.name': { $regex: search, $options: 'i' } },
            ]
          }
        }] : []),
        { $sort: { _id: -1 } },
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
            as_568a_standard: 1,
            jis_b_2401_standard: 1,
            metaTitle: 1,
            metaKeyword: 1,
            metaDesc: 1,
            delivery: 1,
            createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
            modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
            categoryName: { $arrayElemAt: ['$categoryIdDetails.name', 0] },
            subCategoryName: { $arrayElemAt: ['$subCategoryDetails.name', 0] },
            childCategoryName: { $arrayElemAt: ['$childCategoryDetails.name', 0] },
            brandName: { $arrayElemAt: ['$brandDtls.name', 0] },
            wholesalerAttributeDetails: 1,
            customerAttributeDetails: 1,
            offerType: { $ifNull: [{ $arrayElemAt: ['$offers.offerType', 0] }, 'no'] }
          },
        },
      ];

      // Get total count (without pagination)
      const countPipeline = [...pipeline, { $count: 'count' }];
      const countResult = await ProductModel.aggregate(countPipeline);
      const totalCount = countResult[0]?.count ?? 0;

      // Apply pagination if needed
      if (type !== 'all' && limit > 0) {
        pipeline.push({ $skip: page * limit }, { $limit: limit });
      }

      // Execute the query
      const products = await ProductModel.aggregate(pipeline);
      let result: any[] = [];

      if (stockType === 'low-stock') {
        // Process low stock variants
        for (const product of products) {
          const lowStockQuantity = product.lowStockQuantity ?? 20;

          if (product.customerAttribute?.rowData) {
            const lowStockVariants = product.customerAttribute.rowData
              .filter((variant: any) => {
                const stock = Number(variant.stock);
                return !isNaN(stock) && stock < lowStockQuantity;
              })
              .map((variant: any) => ({
                productId: product._id,
                productCode: product.productCode,
                productName: product.productName,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                subCategoryName: product.subCategoryName,
                childCategoryName: product.childCategoryName,
                brandName: product.brandName,
                variant: {
                  sku: variant.sku,
                  stock: variant.stock,
                  price: variant.price,
                  size: variant.Weight,
                  maxLimit: variant.maxLimit,
                  customermrp: variant.customermrp,
                  lowStockQuantity: lowStockQuantity
                },
                productInfo: {
                  shortDescription: product.shortDescription,
                  productImage: product.productImage,
                  description: product.description,
                  packageType: product.packageType,
                  packSize: product.packSize
                }
              }));

            result.push(...lowStockVariants);
          }
        }

        // For low-stock filter, adjust count and pagination
        const finalCount = result.length;
        if (type !== 'all' && limit > 0) {
          result = result.slice(page * limit, (page + 1) * limit);
        }

        return Pagination(finalCount, result, limit, page);
      } else if (stockType === 'current-stock') {
        // Process current stock (non-low stock) variants
        for (const product of products) {
          const lowStockQuantity = product.lowStockQuantity ?? 20;

          if (product.customerAttribute?.rowData) {
            const currentStockVariants = product.customerAttribute.rowData
              .filter((variant: any) => {
                const stock = Number(variant.stock);
                return !isNaN(stock) && stock >= lowStockQuantity;
              })
              .map((variant: any) => ({
                productId: product._id,
                productCode: product.productCode,
                productName: product.productName,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                subCategoryName: product.subCategoryName,
                childCategoryName: product.childCategoryName,
                brandName: product.brandName,
                variant: {
                  sku: variant.sku,
                  stock: variant.stock,
                  price: variant.price,
                  size: variant.Weight,
                  maxLimit: variant.maxLimit,
                  customermrp: variant.customermrp,
                  lowStockQuantity: lowStockQuantity
                },
                productInfo: {
                  shortDescription: product.shortDescription,
                  productImage: product.productImage,
                  description: product.description,
                  packageType: product.packageType,
                  packSize: product.packSize
                }
              }));

            if (currentStockVariants.length > 0) {
              result.push(...currentStockVariants);
            }
          }
        }

        // For current-stock filter, adjust count and pagination
        const finalCount = result.length;
        if (type !== 'all' && limit > 0) {
          result = result.slice(page * limit, (page + 1) * limit);
        }

        return Pagination(finalCount, result, limit, page);
      } else {
        // Original behavior - return full products
        for (const product of products) {
          // Process attribute details to match old response structure
          const processAttributeDetails = (details: any[]) => {
            return details.map((attr: any) => ({
              attributeId: attr._id,
              name: attr.name,
              value: attr.value.map((val: any) => ({
                value: val.value,
                _id: val._id
              }))
            }));
          };

          result.push({
            ...product,
            lowStockQuantity: product.lowStockQuantity ?? 20,
            wholesalerAttributeDetails: product.wholesalerAttributeDetails
              ? processAttributeDetails(product.wholesalerAttributeDetails)
              : [],
            customerAttributeDetails: product.customerAttributeDetails
              ? processAttributeDetails(product.customerAttributeDetails)
              : []
          });
        }

        return Pagination(totalCount, result, limit, page);
      }
    } catch (error: any) {
      console.error('Error in product list:', error);
      return createErrorResponse(
        'Error retrieving products',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async activeList(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
    try {
      const { page = 0, limit = 10, type, search, categoryId, stockType, userId } = params;

      // Base match stage
      const matchStage: any = {
        isActive: true,
        isDelete: false,
        productStatus: true

      };
      let roleName
      let role
      if (userId) {

        role = await WholesalerRetailsers.findOne({ _id: userId });
        if (!role) {
          return createErrorResponse(
            'Role not found',
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Role not found'
          );
        }
        roleName = await CustomerVariants.findOne({ _id: role?.customerVariant });
      }

      // Add search filter if provided
      // if (search) {
      //   matchStage.$or = [
      //     { productName: { $regex: search, $options: 'i' } },
      //     { productCode: { $regex: search, $options: 'i' } },
      //     { 'brandDtls.name': { $regex: search, $options: 'i' } },
      //     { 'categoryIdDetails.name': { $regex: search, $options: 'i' } },
      //     { 'subCategoryDetails.name': { $regex: search, $options: 'i' } },
      //   ];
      // }

      // Add category filter if provided
      if (categoryId) {
        matchStage.categoryId = { $in: categoryId.split(',').map((val) => new Types.ObjectId(val)) };
      }

      const pipeline: any[] = [
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandDtls',
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryIdDetails',
          },
        },
        {
          $lookup: {
            from: 'subcategories',
            localField: 'subCategory',
            foreignField: '_id',
            as: 'subCategoryDetails',
          },
        },
        {
          $lookup: {
            from: 'childcategories',
            localField: 'childCategory',
            foreignField: '_id',
            as: 'childCategoryDetails',
          },
        },
        {
          $lookup: {
            from: 'attributes',
            localField: 'wholesalerAttribute.attributeId',
            foreignField: '_id',
            as: 'wholesalerAttributeDetails',
          },
        },
        {
          $lookup: {
            from: 'attributes',
            localField: 'customerAttribute.attributeId',
            foreignField: '_id',
            as: 'customerAttributeDetails',
          },
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'modifiedBy',
            foreignField: '_id',
            as: 'modifiedBy',
          },
        },
        {
          $lookup: {
            from: 'offers',
            localField: '_id',
            foreignField: 'productId.id',
            as: 'offers',
          },
        },
        ...(search ? [{
          $match: {
            $or: [
              { productName: { $regex: search, $options: 'i' } },
              { productCode: { $regex: search, $options: 'i' } },
              { 'brandDtls.name': { $regex: search, $options: 'i' } },
              { 'categoryIdDetails.name': { $regex: search, $options: 'i' } },
              { 'subCategoryDetails.name': { $regex: search, $options: 'i' } },
            ]
          }
        }] : []),
        { $sort: { _id: -1 } },
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
            createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
            modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
            categoryName: { $arrayElemAt: ['$categoryIdDetails.name', 0] },
            subCategoryName: { $arrayElemAt: ['$subCategoryDetails.name', 0] },
            childCategoryName: { $arrayElemAt: ['$childCategoryDetails.name', 0] },
            brandName: { $arrayElemAt: ['$brandDtls.name', 0] },
            wholesalerAttributeDetails: 1,
            customerAttributeDetails: 1,
            offerType: { $ifNull: [{ $arrayElemAt: ['$offers.offerType', 0] }, 'no'] }
          },
        },
      ];
      if (userId && roleName?.name) {
        pipeline.push({
          $addFields: {
            "wholesalerAttribute.rowData": {
              $map: {
                input: "$wholesalerAttribute.rowData",
                as: "variant",
                in: {
                  $mergeObjects: [
                    "$$variant",
                    {
                      price: {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: [roleName.name, "Gold"] },
                              then: "$$variant.gold"
                            },
                            {
                              case: { $eq: [roleName.name, "Silver"] },
                              then: "$$variant.silver"
                            },
                            {
                              case: { $eq: [roleName.name, "Platinum"] },
                              then: "$$variant.platinum"
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
        });
      }


      // Get total count (without pagination)
      const countPipeline = [...pipeline, { $count: 'count' }];
      const countResult = await ProductModel.aggregate(countPipeline);
      const totalCount = countResult[0]?.count ?? 0;

      // Apply pagination if needed
      if (type !== 'all' && limit > 0) {
        pipeline.push({ $skip: page * limit }, { $limit: limit });
      }

      // Execute the query
      const products = await ProductModel.aggregate(pipeline);
      let result: any[] = [];

      if (stockType === 'low-stock') {
        // Process low stock variants
        for (const product of products) {
          const lowStockQuantity = product.lowStockQuantity ?? 20;

          if (product.customerAttribute?.rowData) {
            const lowStockVariants = product.customerAttribute.rowData
              .filter((variant: any) => {
                const stock = Number(variant.stock);
                return !isNaN(stock) && stock < lowStockQuantity;
              })
              .map((variant: any) => ({
                productId: product._id,
                productCode: product.productCode,
                productName: product.productName,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                subCategoryName: product.subCategoryName,
                childCategoryName: product.childCategoryName,
                brandName: product.brandName,
                variant: {
                  sku: variant.sku,
                  stock: variant.stock,
                  price: variant.price,
                  size: variant.Weight,
                  maxLimit: variant.maxLimit,
                  customermrp: variant.customermrp,
                  lowStockQuantity: lowStockQuantity
                },
                productInfo: {
                  shortDescription: product.shortDescription,
                  productImage: product.productImage,
                  description: product.description,
                  packageType: product.packageType,
                  packSize: product.packSize
                }
              }));

            result.push(...lowStockVariants);
          }
        }

        // For low-stock filter, adjust count and pagination
        const finalCount = result.length;
        if (type !== 'all' && limit > 0) {
          result = result.slice(page * limit, (page + 1) * limit);
        }

        return Pagination(finalCount, result, limit, page);
      } else if (stockType === 'current-stock') {
        // Process current stock (non-low stock) variants
        for (const product of products) {
          const lowStockQuantity = product.lowStockQuantity ?? 20;

          if (product.customerAttribute?.rowData) {
            const currentStockVariants = product.customerAttribute.rowData
              .filter((variant: any) => {
                const stock = Number(variant.stock);
                return !isNaN(stock) && stock >= lowStockQuantity;
              })
              .map((variant: any) => ({
                productId: product._id,
                productCode: product.productCode,
                productName: product.productName,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                subCategoryName: product.subCategoryName,
                childCategoryName: product.childCategoryName,
                brandName: product.brandName,
                variant: {
                  sku: variant.sku,
                  stock: variant.stock,
                  price: variant.price,
                  size: variant.Weight,
                  maxLimit: variant.maxLimit,
                  customermrp: variant.customermrp,
                  lowStockQuantity: lowStockQuantity
                },
                productInfo: {
                  shortDescription: product.shortDescription,
                  productImage: product.productImage,
                  description: product.description,
                  packageType: product.packageType,
                  packSize: product.packSize
                }
              }));

            if (currentStockVariants.length > 0) {
              result.push(...currentStockVariants);
            }
          }
        }

        // For current-stock filter, adjust count and pagination
        const finalCount = result.length;
        if (type !== 'all' && limit > 0) {
          result = result.slice(page * limit, (page + 1) * limit);
        }

        return Pagination(finalCount, result, limit, page);
      } else {
        // Original behavior - return full products
        for (const product of products) {
          // Process attribute details to match old response structure
          const processAttributeDetails = (details: any[]) => {
            return details.map((attr: any) => ({
              attributeId: attr._id,
              name: attr.name,
              value: attr.value.map((val: any) => ({
                value: val.value,
                _id: val._id
              }))
            }));
          };

          result.push({
            ...product,
            lowStockQuantity: product.lowStockQuantity ?? 20,
            wholesalerAttributeDetails: product.wholesalerAttributeDetails
              ? processAttributeDetails(product.wholesalerAttributeDetails)
              : [],
            customerAttributeDetails: product.customerAttributeDetails
              ? processAttributeDetails(product.customerAttributeDetails)
              : []
          });
        }

        return Pagination(totalCount, result, limit, page);
      }
    } catch (error: any) {
      console.error('Error in product list:', error);
      return createErrorResponse(
        'Error retrieving products',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async delete(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const findProduct = await ProductModel.findById({
        _id: new Types.ObjectId(id), isActive: true, isDelete: false
      })

      const delteProduct = await ProductModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), isActive: true, isDelete: false },
        {
          $set: {
            isDelete: true,
            modifiedBy: new Types.ObjectId(userId),
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!delteProduct) {
        return createErrorResponse(
          'Error in product delete',
          StatusCodes.NOT_FOUND,
          'Product with given ID not found'
        );
      }


      if (findProduct) {
        const productHistory = {
          ...findProduct.toObject(),
          deletedUserId: new Types.ObjectId(userId)
        };

        await HistoryModel.create({
          history: [productHistory],
          createdBy: new Types.ObjectId(userId),
          modifiedBy: new Types.ObjectId(userId)
        });
      }

      const result: SuccessMessage = {
        message: 'Product deleted success.'
      };
      return successResponse("Product deleted successfully", StatusCodes.OK, result);

    } catch (error: any) {
      return createErrorResponse(
        'Error delete product',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  // async activeList(params: ProductListParams): Promise<PaginationResult<ProductDocument> | ErrorResponse> {
  //   try {
  //     const { page, limit, type, search, categoryId, stockType, userId } = params;
  //     let roleName
  //     let role
  //     if (userId) {

  //       role = await WholesalerRetailsers.findOne({ _id: userId });
  //       if (!role) {
  //         return createErrorResponse(
  //           'Role not found',
  //           StatusCodes.INTERNAL_SERVER_ERROR,
  //           'Role not found'
  //         );
  //       }
  //       roleName = await CustomerVariants.findOne({ _id: role?.customerVariant });
  //     }

  //     // Base match stage
  //     const matchStage: any = {
  //       isActive: true,
  //       isDelete: false,
  //       productStatus: true
  //     };
  //     if (categoryId) {
  //       matchStage.categoryId = { $in: categoryId.split(',').map((val) => new ObjectId(val)) };
  //     }

  //     const pipeline: any[] = [
  //       { $match: matchStage },
  //       {
  //         $lookup: {
  //           from: "brands",
  //           localField: "brand",
  //           foreignField: "_id",
  //           as: "brandDtls"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "units",
  //           localField: "unit",
  //           foreignField: "_id",
  //           as: "unitDtls"
  //         }
  //       },
  //       {
  //         $unwind: {
  //           path: "$priceTiers",
  //           preserveNullAndEmptyArrays: true
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: "$_id",
  //           doc: { $first: "$$ROOT" },
  //           priceTiers: { $push: "$priceTiers" }
  //         }
  //       },
  //       {
  //         $replaceRoot: {
  //           newRoot: {
  //             $mergeObjects: ["$doc", { priceTiers: "$priceTiers" }]
  //           }
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "categories",
  //           localField: "categoryId",
  //           foreignField: "_id",
  //           as: "categoryIdDetails"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "subcategories",
  //           localField: "subCategory",
  //           foreignField: "_id",
  //           as: "subCategoryDetails"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "childcategories",
  //           localField: "childCategory",
  //           foreignField: "_id",
  //           as: "childCategoryDetails"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "admins",
  //           localField: "createdBy",
  //           foreignField: "_id",
  //           as: "createdBy"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "admins",
  //           localField: "modifiedBy",
  //           foreignField: "_id",
  //           as: "modifiedBy"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "offers",
  //           localField: "_id",
  //           foreignField: "productId.id",
  //           as: "offers"
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: "taxes",
  //           localField: "tax",
  //           foreignField: "_id",
  //           as: "taxes"
  //         }
  //       },
  //       ...(search ? [{
  //         $match: {
  //           $or: [
  //             { productName: { $regex: search, $options: 'i' } },
  //             // { productCode: { $regex: search, $options: 'i' } },
  //             // { 'brandDtls.name': { $regex: search, $options: 'i' } },
  //             // { 'categoryIdDetails.name': { $regex: search, $options: 'i' } },
  //             // { 'subCategoryDetails.name': { $regex: search, $options: 'i' } },
  //           ]
  //         }
  //       }] : []),
  //       {
  //         $sort: {
  //           _id: -1
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           productCode: 1,
  //           isActive: 1,
  //           isDelete: 1,
  //           productName: 1,
  //           productImage: 1,
  //           additionalImage: 1,
  //           lowStockAlert: 1,
  //           isDecimalQuantity: 1,
  //           lowStockQuantity: 1,
  //           tagAndLabel: 1,
  //           refundable: 1,
  //           productStatus: 1,
  //           description: 1,
  //           stock: 1,
  //           priceTiers: 1,
  //           packingType: 1,
  //           purchaseDate: 1,
  //           purchasePrice: 1,
  //           purchaseNetPrice: 1,
  //           createdBy: { $arrayElemAt: ["$createdBy.name", 0] },
  //           modifiedBy: { $arrayElemAt: ["$modifiedBy.name", 0] },
  //           categoryName: { $arrayElemAt: ["$categoryIdDetails.name", 0] },
  //           subCategoryName: { $arrayElemAt: ["$subCategoryDetails.name", 0] },
  //           childCategoryName: { $arrayElemAt: ["$childCategoryDetails.name", 0] },
  //           brandName: { $arrayElemAt: ["$brandDtls.name", 0] },
  //           unitName: { $arrayElemAt: ["$unitDtls.name", 0] },
  //           unitId: { $arrayElemAt: ["$unitDtls._id", 0] },
  //           hsn: 1,
  //           tax: 1,
  //           taxRate: { $arrayElemAt: ["$taxes.taxRate", 0] },
  //           unitWeight: 1
  //         }
  //       }
  //     ]

  //     // Add user-based price tier modification
  //     if (userId && roleName?.name) {
  //       pipeline.push({
  //         $addFields: {
  //           priceTiers: {
  //             $map: {
  //               input: "$priceTiers",
  //               as: "tier",
  //               in: {
  //                 $mergeObjects: [
  //                   "$$tier",
  //                   {
  //                     price: {
  //                       $switch: {
  //                         branches: [
  //                           { case: { $eq: [roleName.name, "Silver"] }, then: "$$tier.silver" },
  //                           { case: { $eq: [roleName.name, "Gold"] }, then: "$$tier.gold" },
  //                           { case: { $eq: [roleName.name, "Platinum"] }, then: "$$tier.platinum" }
  //                         ],
  //                         default: "$$tier.price"
  //                       }
  //                     }
  //                   }
  //                 ]
  //               }
  //             }
  //           }
  //         }
  //       });
  //     }

  //     const countPipeline = [...pipeline, { $count: 'count' }];
  //     const countResult = await ProductModel.aggregate(countPipeline);
  //     const totalCount = countResult[0]?.count ?? 0;
  //     if (type !== 'all' && limit > 0) {
  //       pipeline.push({ $skip: page * limit }, { $limit: limit });
  //     }
  //     const products = await ProductModel.aggregate(pipeline);
  //     let result: any[] = [];

  //     if (stockType === 'low-stock') {
  //       result = products.filter(product => {
  //         const lowStockQuantity = product.lowStockQuantity ?? 20;
  //         return product.stock < lowStockQuantity;
  //       }).map(product => ({
  //         productId: product._id,
  //         productCode: product.productCode,
  //         productName: product.productName,
  //         categoryId: product.categoryId,
  //         categoryName: product.categoryName,
  //         subCategoryName: product.subCategoryName,
  //         childCategoryName: product.childCategoryName,
  //         brandName: product.brandName,
  //         stock: product.stock,
  //         lowStockQuantity: product.lowStockQuantity ?? 20,
  //         productInfo: {
  //           description: product.description,
  //           productImage: product.productImage,
  //           packingType: product.packingType
  //         }
  //       }));

  //       const finalCount = result.length;
  //       return Pagination(finalCount, result, limit, page);
  //     } else if (stockType === 'current-stock') {
  //       // Show ALL products (no stock filtering)
  //       result = products.map(product => ({
  //         productId: product._id,
  //         productCode: product.productCode,
  //         productName: product.productName,
  //         categoryId: product.categoryId,
  //         categoryName: product.categoryName,
  //         subCategoryName: product.subCategoryName,
  //         childCategoryName: product.childCategoryName,
  //         brandName: product.brandName,
  //         stock: product.stock,
  //         lowStockQuantity: product.lowStockQuantity ?? 20,
  //         productInfo: {
  //           description: product.description,
  //           productImage: product.productImage,
  //           packingType: product.packingType
  //         }
  //       }));
  //       return Pagination(totalCount, result, limit, page);
  //     } else {
  //       for (const product of products) {
  //         result.push({
  //           ...product,
  //           lowStockQuantity: product.lowStockQuantity ?? 20
  //         });
  //       }

  //       return Pagination(totalCount, result, limit, page);
  //     }

  //   } catch (error: any) {
  //     console.error('Error in product list:', error);
  //     return createErrorResponse(
  //       'Error retrieving products',
  //       StatusCodes.INTERNAL_SERVER_ERROR,
  //       error.message
  //     );
  //   }
  // }

}

export function NewProductRepoistory(db: any): ProductDomainRepository {
  return new ProductRepository(db)
}