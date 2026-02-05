import { Types } from "mongoose";
import {
  VendorDomainRepository,
  VendorListParams,
} from "../../../domain/admin/vendorDomain";
import {
  CreateVendorInput,
  UpdateVendorInput,
} from "../../../api/Request/vendor";
import { Vendor, VendorDtls, VendorProduct } from "../../../api/response/vendor.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import {
  ApiResponse,
  SuccessMessage,
} from "../../../api/response/commonResponse";
import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import VendorModel from "../../../app/model/vendor";
import Pagination, {
  PaginationResult,
} from "../../../api/response/paginationResponse";
import { successResponse } from "../../../utils/common/commonResponse";
import { ProductModel } from "../../../app/model/product";
import Vendorpurchase from "../../../app/model/vendor.purchase";
import Attribute from "../../../app/model/attribute";
import Category, { ICategory } from "../../../app/model/category";
import { ProductHelper } from "../../../utils/utilsFunctions/product.helper";
import { logUserActivity } from "../../../utils/utilsFunctions/user.activity";
import subcategory from "../../../app/model/subcategory";
import childCategory from "../../../app/model/childCategory";
import Brand from "../../../app/model/brand";
import moment from "moment";
import { Uploads } from "../../../utils/uploads/image.upload";

class VendorRepository implements VendorDomainRepository {
  private readonly db: any;

  constructor(db: any) {
    this.db = db;
  }
  async findVenderInProduct(id: string): Promise<Boolean | ErrorResponse> {
    try {
      const count = await ProductModel.countDocuments({
        vendorId: new Types.ObjectId(id),
        isActive: true,
        isDelete: false
      })

      return count > 0

    } catch (error) {
      return createErrorResponse(
        'Error in  product vendor ',
        StatusCodes.NOT_FOUND,
        'vendor with given ID not found'
      );
    }
  }
  async deleteVendor(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const delteVendor = await VendorModel.findOneAndUpdate(
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

      if (!delteVendor) {
        return createErrorResponse(
          'Error in vendor delete',
          StatusCodes.NOT_FOUND,
          'Product with given ID not found'
        );
      }

      const result: SuccessMessage = {
        message: 'vendor deleted success.'
      };
      return successResponse("vendor deleted successfully", StatusCodes.OK, result);
    } catch (error: any) {
      return createErrorResponse(
        "Error retrieving vendor details",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }

  }

  async getVendorList(
    params: VendorListParams
  ): Promise<PaginationResult<VendorDtls> | ErrorResponse | any> {
    try {
      const { page = 0, limit = 10, search = "", type, format } = params;
      const matchFilter: any = {
        isActive: true,
        isDelete: false,
      };

      if (search) {
        matchFilter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { vendorCode: { $regex: search, $options: "i" } }
        ];
      }

      const basePipeline: any[] = [
        { $match: matchFilter },

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
          $lookup: {
            from: "products",
            localField: "products.id",
            foreignField: "_id",
            as: "productDetails",
            pipeline: [
              { $project: { _id: 1, productName: 1 } }
            ]
          }
        },

        {
          $project: {
            vendorCode: 1,
            name: 1,
            contactPerson: 1,
            phoneNumber: 1,
            email: 1,
            paymentDueDays: 1,
            address: 1,
            gstNumber: 1,
            bankName: 1,
            accountNumber: 1,
            ifscCode: 1,
            city: 1,
            alternativeNumber: 1,
            isActive: 1,
            isDelete: 1,
            createdAt: 1,

            createdBy: { $arrayElemAt: ["$createdBy.name", 0] },
            modifiedBy: { $arrayElemAt: ["$modifiedBy.name", 0] },

            productNames: {
              $map: {
                input: "$productDetails",
                as: "p",
                in: "$$p.productName"
              }
            }
          }
        },

        { $sort: { createdAt: -1 } }
      ];
      const countPipeline = [...basePipeline, { $count: "total" }];
      const dataPipeline =
        format === "excel" || type === "all"
          ? basePipeline
          : [...basePipeline, { $skip: page * limit }, { $limit: limit }];

      const [vendors, countResult] = await Promise.all([
        VendorModel.aggregate(dataPipeline),
        VendorModel.aggregate(countPipeline)
      ]);

      const total = countResult[0]?.total || 0;
      if (format === "excel") {
        const excelData = vendors.map((v: any, index: number) => ({
          "S No": index + 1,
          "Vendor Code": v.vendorCode,
          "Vendor Name": v.name,
          "Contact Person": v.contactPerson ?? "",
          "Phone Number": v.phoneNumber,
          "Email": v.email ?? "",
          "GST Number": v.gstNumber ?? "",
          "Payment Due Days": v.paymentDueDays,
          "Bank Name": v.bankName ?? "",
          "Account Number": v.accountNumber ?? "",
          "IFSC Code": v.ifscCode ?? "",
          "City": v.city ?? "",
          "Alternative Number": v.alternativeNumber ?? "",
          "Products": Array.isArray(v.productNames)
            ? v.productNames.join(", ")
            : "",
          "Created By": v.createdBy ?? "",
          "Created At": moment(v.createdAt).format("DD-MM-YYYY HH:mm")
        }));

        return await Uploads.generateExcel(excelData);
      }

      return Pagination(total, vendors, limit, page);

    } catch (error: any) {
      return createErrorResponse(
        "Error retrieving vendor details",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }


  async findVendorById(
    id: string
  ): Promise<ApiResponse<VendorDtls> | ErrorResponse> {
    try {
      const vendor = await VendorModel.findOne({ _id: new Types.ObjectId(id) })
        .populate("createdBy", "name")
        .populate("modifiedBy", "name");

      if (!vendor) {
        return createErrorResponse(
          "Vendor not found.",
          StatusCodes.BAD_REQUEST,
          "Error vendor not found"
        );
      }
      const transformProducts = (products: any[]): VendorProduct[] => {
        if (!products || !Array.isArray(products)) return [];

        return products.map(product => {
          if (product._id && product.id) {
            return {
              label: product.label || product.productName,
              value: product.value || product.id.toString()
            };
          } else if (product._id) {
            return {
              id: product._id.toString(),
              label: product._id.toString(),
              value: product._id.toString()
            };
          }
          return { label: '', value: '', id: '' };
        }).filter(p => p.value);
      };

      const result: VendorDtls = {
        _id: vendor._id.toString(),
        name: vendor?.name,
        contactPerson: vendor?.contactPerson ?? "",
        phoneNumber: vendor?.phoneNumber,
        paymentDueDays: vendor.paymentDueDays,
        address: vendor.address,
        gstNumber: vendor.gstNumber ?? "",
        createdBy: vendor.createdBy?.toString(),
        modifiedBy: vendor.modifiedBy?.toString(),
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        products: transformProducts(vendor.products),
        bankName: vendor.bankName?.toString() || "",
        accountNumber: vendor.accountNumber?.toString() || "",
        ifscCode: vendor.ifscCode?.toString() || "",
        city: vendor.city?.toString() || "",
        alternativeNumber: vendor.alternativeNumber?.toString() || ""
      };

      return successResponse(
        "Vendor details retrieved successfully",
        StatusCodes.OK,
        result
      );
    } catch (error: any) {
      return createErrorResponse(
        "Error retrieving vendor details",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async findVendorId(id: string): Promise<Boolean | ErrorResponse> {
    try {
      const count = await VendorModel.countDocuments({
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

  async findVendorEmailForUpdate(
    email: string,
    id: string
  ): Promise<{ count: number; statusCode: number } | ErrorResponse> {
    try {
      const count = await VendorModel.countDocuments({
        _id: { $ne: new Types.ObjectId(id) },
        email: email,
      });

      return { count, statusCode: StatusCodes.OK };
    } catch (error: any) {
      return createErrorResponse(
        "Error checking vendor email existence",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async findVendorEmailExist(
    email: string
  ): Promise<{ count: number; statusCode: number } | ErrorResponse> {
    try {
      const count = await VendorModel.countDocuments({
        email: email,
      });

      return { count, statusCode: StatusCodes.OK };
    } catch (error: any) {
      return createErrorResponse(
        "Error checking vendor email existence",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async createVendor(
    vendorInput: CreateVendorInput,
    userId: string
  ): Promise<ApiResponse<Vendor> | ErrorResponse> {
    try {
      const count = await VendorModel.countDocuments({
        isActive: true,
        isDelete: false,
      });

      let code = "VENDOR-";
      const len = count + 1;
      code = code.concat(len.toString().padStart(3, "0"));

      const emailValue = vendorInput.email?.trim();
      const finalEmail = emailValue === "" ? null : emailValue;

      const input = {
        vendorCode: code,
        name: vendorInput.name.trim(),
        contactPerson: vendorInput.contactPerson.trim(),
        phoneNumber: vendorInput.phoneNumber.trim(),
        email: finalEmail,
        paymentDueDays: vendorInput.paymentDueDays.trim(),
        address: vendorInput.address.trim(),
        gstNumber: vendorInput.gstNumber?.trim(),
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        products: vendorInput.products,
        bankName: vendorInput?.bankName?.trim(),
        accountNumber: vendorInput?.accountNumber?.trim(),
        ifscCode: vendorInput?.ifscCode?.trim(),
        city: vendorInput?.city?.trim(),
        alternativeNumber: vendorInput?.alternativeNumber?.trim()
      };

      const createdVendor = await VendorModel.create(input);

      const result: Vendor = {
        vendorCode: createdVendor?.vendorCode ?? "",
        name: createdVendor.name,
        contactPerson: createdVendor?.contactPerson ?? "",
        phoneNumber: createdVendor.phoneNumber,
        email: createdVendor?.email ?? "",
        paymentDueDays: createdVendor.paymentDueDays,
        address: createdVendor.address,
        gstNumber: createdVendor?.gstNumber ?? "",
        bankName: createdVendor?.bankName ?? "",
        accountNumber: createdVendor?.accountNumber ?? "",
        ifscCode: createdVendor?.ifscCode ?? "",
        city: createdVendor.city,
        alternativeNumber: createdVendor?.alternativeNumber ?? "",
      };

      return successResponse(
        "Vendor created successfully",
        StatusCodes.CREATED,
        result
      );
    } catch (error: any) {
      return createErrorResponse(
        "Error creating vendor",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateVendor(
    vendorInput: UpdateVendorInput,
    userId: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const input = {
        name: vendorInput.name.trim(),
        contactPerson: vendorInput.contactPerson.trim(),
        phoneNumber: vendorInput.phoneNumber.trim(),
        email: vendorInput?.email?.trim(),
        paymentDueDays: vendorInput.paymentDueDays.trim(),
        address: vendorInput.address.trim(),
        gstNumber: vendorInput.gstNumber?.trim(),
        modifiedBy: new Types.ObjectId(userId),
        products: vendorInput.products,
        bankName: vendorInput?.bankName?.trim(),
        accountNumber: vendorInput?.accountNumber?.trim(),
        ifscCode: vendorInput?.ifscCode?.trim(),
        city: vendorInput?.city?.trim(),
        alternativeNumber: vendorInput?.alternativeNumber?.trim()
      };

      await VendorModel.updateOne(
        { _id: new Types.ObjectId(vendorInput.id) },
        { $set: input }
      );

      const result: SuccessMessage = {
        message: "Vendor update success.",
      };

      return successResponse(
        "Vendor updated successfully",
        StatusCodes.OK,
        result
      );
    } catch (error: any) {
      return createErrorResponse(
        "Error updating vendor",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getVendoBasedProductsList(
    params: VendorListParams
  ): Promise<PaginationResult<VendorDtls> | ErrorResponse> {
    try {
      const { page, limit, search, type, vendorId } = params;

      if (vendorId === 'all') {
        const productSearchQuery = search
          ? {
            $or: [
              { productName: { $regex: search, $options: "i" } },
              { productCode: { $regex: search, $options: "i" } },
            ],
          }
          : {};

        const productMatch = {
          isActive: true,
          isDelete: false,
          ...productSearchQuery,
        };

        const [products, total] = await Promise.all([
          ProductModel.find(productMatch)
            .skip(page * limit)
            .limit(limit)
            .lean(),
          ProductModel.countDocuments(productMatch),
        ]);

        const enrichedProducts = await Promise.all(
          products.map(async (element) => {
            const customerAttrIds = (element.customerAttribute?.attributeId || [])
              .filter(id => id != null).map(id => id.toString());
            const wholesalerAttrIds = (element.wholesalerAttribute?.attributeId || [])
              .filter(id => id != null).map(id => id.toString());

            const [customerAttributeDetails, wholesalerAttributeDetails, category, vendor] = await Promise.all([
              Attribute.find({ _id: { $in: customerAttrIds } }).lean(),
              Attribute.find({ _id: { $in: wholesalerAttrIds } }).lean(),
              Category.findOne({ _id: element.categoryId }).lean(),
              VendorModel.findOne({ products: { $elemMatch: { id: element._id } } }).lean()
            ]);

            const productDtls: any = {
              _id: element._id,
              productCode: element.productCode,
              productName: element.productName ?? "",
              productImage: element.productImage ?? "",
              categoryName: category?.name ?? '',
              categoryId: element.categoryId,
              vendorName: vendor?.name ?? 'No vendor',
            };

            if (type === 'customer') {
              const rowData = element.customerAttribute?.rowData || [];
              productDtls.customerAttributeDetails = ProductHelper.buildAttributeTree(
                customerAttributeDetails || [],
                rowData,
                customerAttrIds
              );
            } else if (type === 'wholesaler') {
              const rowData = element.wholesalerAttribute?.rowData || [];
              productDtls.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                wholesalerAttributeDetails || [],
                rowData,
                wholesalerAttrIds
              );
            }

            return productDtls;
          })
        );

        return Pagination(total, enrichedProducts, page, limit);

      }

      const searchQuery = search
        ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phoneNumber: { $regex: search, $options: "i" } },
          ],
        }
        : {};

      const baseMatch = {
        isActive: true,
        isDelete: false,
        ...searchQuery,
        _id: new Types.ObjectId(vendorId)
      };

      const pipeline: any[] = [
        { $match: baseMatch },
        {
          $lookup: {
            from: "admins",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $lookup: {
            from: "admins",
            localField: "modifiedBy",
            foreignField: "_id",
            as: "modifiedBy",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productsDetails",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            products: 1,
            createdAt: 1,
            updatedAt: 1,
            createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
            modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
            productsDetails: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: page * limit },
        { $limit: limit },
      ];

      const [vendorDtls, count] = await Promise.all([
        VendorModel.aggregate(pipeline),
        VendorModel.countDocuments(baseMatch),
      ]);

      const finalResult = await Promise.all(
        vendorDtls.map(async (vendor) => {
          const vendorProducts: any[] = [];

          if (vendor.productsDetails) {
            for (const prodItem of vendor.products) {
              const element = await ProductModel.findOne({ _id: prodItem.id }).lean();
              if (!element) continue;

              const vendorPurchased = vendorId === 'all'
                ? null
                : await Vendorpurchase.findOne({
                  vendorId: vendor._id,
                  "products.id": { $in: [element._id] }
                }).sort({ createAt: -1 }).lean();

              const customerAttrIds = (element.customerAttribute?.attributeId || [])
                .filter(id => id != null).map(id => id.toString());
              const wholesalerAttrIds = (element.wholesalerAttribute?.attributeId || [])
                .filter(id => id != null).map(id => id.toString());

              const [customerAttributeDetails, wholesalerAttributeDetails, category] = await Promise.all([
                Attribute.find({ _id: { $in: customerAttrIds } }).lean(),
                Attribute.find({ _id: { $in: wholesalerAttrIds } }).lean(),
                Category.findOne({ _id: element.categoryId }).lean()
              ]);

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
                quantityPerPack: element.quantityPerPack ?? "",
                packingType: element.packingType ?? "",
                isIncentive: element.isIncentive ?? false,
                showToLineman: element.showToLineman ?? false,
                metaTitle: element.metaTitle ?? "",
                metaKeyword: element.metaKeyword ?? "",
                metaDesc: element.metaDesc ?? "",
                delivery: element.delivery ?? "",
                createdBy: element.createdBy ?? "",
                modifiedBy: element.modifiedBy ?? "",
                wholesalerAttributeDetails: [],
                customerAttributeDetails: [],
                categoryName: category?.name ?? '',
                categoryId: element.categoryId,
                lastPurchasedDate: vendorPurchased?.createdAt ?? '',
                vendorName: vendorId === 'all' ? vendor.name : undefined // Include vendor name for all products
              };

              if (params.type === 'customer') {
                const rowData = element.customerAttribute?.rowData || [];
                productDtls.customerAttributeDetails = ProductHelper.buildAttributeTree(
                  customerAttributeDetails || [],
                  rowData,
                  customerAttrIds
                );
              } else if (params.type === 'wholesaler') {
                const rowData = element.wholesalerAttribute?.rowData || [];
                productDtls.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                  wholesalerAttributeDetails || [],
                  rowData,
                  wholesalerAttrIds
                );
              }
              vendorProducts.push(productDtls);
            }
          }
          return {
            ...vendor,
            products: vendorProducts,
          };
        })
      );

      return Pagination(count, finalResult, limit, page);
    } catch (error: any) {
      return createErrorResponse(
        "Error retrieving products",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

}

export function NewVendorRepository(db: any): VendorDomainRepository {
  return new VendorRepository(db);
}
