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
        "dddddddd",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }

  }

  async getVendorList(
    params: VendorListParams
  ): Promise<PaginationResult<VendorDtls> | ErrorResponse> {
    try {
      const { page, limit, search, type } = params;
      const query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ],
      };

      const pipeline: any = [
        {
          $match: {
            isActive: true,
            isDelete: false,
            ...query
          },
        },
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
            localField: "products.id",
            foreignField: "_id",
            as: "productDetails",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  productName: 1
                }
              }
            ]
          }
        }
        , {
          $project: {
            name: 1,
            isActive: 1,
            isDelete: 1,
            vendorCode: 1,
            contactPerson: 1,
            phoneNumber: 1,
            email: 1,
            paymentDueDays: 1,
            address: 1,
            gstNumber: 1,
            createdBy: { $arrayElemAt: ["$createdBy.name", 0] },
            modifiedBy: { $arrayElemAt: ["$modifiedBy.name", 0] },
            products: 1
          },
        },
      ];

      if (type !== "all") {
        pipeline.push({ $skip: page * limit }, { $limit: limit });
      }

      const vendorDtls = await VendorModel.aggregate(pipeline);

      const count = await VendorModel.countDocuments(query);
      return Pagination(count, vendorDtls, limit, page);
    } catch (error: any) {
      return createErrorResponse(
        "11",
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
      // Transform products to match VendorProduct interface
      const transformProducts = (products: any[]): VendorProduct[] => {
        if (!products || !Array.isArray(products)) return [];

        return products.map(product => {
          // Handle both populated and unpopulated cases
          if (product._id && product.id) {
            // Already transformed by populate transform
            return {
              label: product.label || product.productName,
              value: product.value || product.id.toString()
            };
          } else if (product._id) {
            // Raw product reference case
            return {
              id: product._id.toString(),
              label: product._id.toString(), // or fetch name if needed
              value: product._id.toString()
            };
          }
          return { label: '', value: '', id: '' }; // Fallback
        }).filter(p => p.value); // Filter out invalid entries
      };

      const result: VendorDtls = {
        _id: vendor._id.toString(),
        name: vendor.name,
        contactPerson: vendor.contactPerson ?? "",
        phoneNumber: vendor.phoneNumber,
        paymentDueDays: vendor.paymentDueDays,
        address: vendor.address,
        gstNumber: vendor.gstNumber ?? "",
        createdBy: vendor.createdBy.toString(),
        modifiedBy: vendor.modifiedBy.toString(),
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        products: transformProducts(vendor.products),
        accountNumber: vendor.accountNumber ?? "",
        ifscCode: vendor.ifscCode ?? ""
      };

      return successResponse(
        "Vendor details retrieved successfully",
        StatusCodes.OK,
        result
      );
    } catch (error: any) {
      return createErrorResponse(
        "55",
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

      const input = {
        vendorCode: code,
        name: vendorInput.name.trim(),
        contactPerson: vendorInput.contactPerson.trim(),
        phoneNumber: vendorInput.phoneNumber.trim(),
        email: vendorInput?.email?.trim(),
        paymentDueDays: vendorInput.paymentDueDays.trim(),
        address: vendorInput.address.trim(),
        gstNumber: vendorInput.gstNumber?.trim(),
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        products: vendorInput.products,
      };

      await VendorModel.create(input);

      const result: Vendor = {
        name: vendorInput.name,
        contactPerson: vendorInput.contactPerson,
        phoneNumber: vendorInput.phoneNumber,
        paymentDueDays: vendorInput.paymentDueDays,
        address: vendorInput.address,
        gstNumber: vendorInput.gstNumber,
        accountNumber: vendorInput.accountNumber ?? "",
        ifscCode: vendorInput.ifscCode ?? ""

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
        paymentDueDays: vendorInput.paymentDueDays.trim(),
        address: vendorInput.address.trim(),
        gstNumber: vendorInput.gstNumber?.trim(),
        modifiedBy: new Types.ObjectId(userId),
        products: vendorInput.products,

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
      const { page, limit, search, type } = params;

      const query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ],
      };

      const pipeline: any = [
        {
          $match: {
            isActive: true,
            isDelete: false,
            ...query
          },
        },
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
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendors",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "products.id",
            foreignField: "_id",
            as: "productDetails",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  productName: 1,
                  customerAttribute: 1,
                  wholesalerAttribute: 1,
                  attributes: 1
                }
              }
            ]
          }
        },
        {
          $project: {
            vendorName: { $arrayElemAt: ["$vendors.name", 0] },
            quantity: 1,
            createdBy: { $arrayElemAt: ["$createdBy.name", 0] },
            modifiedBy: { $arrayElemAt: ["$modifiedBy.name", 0] },
            products: 1,
            productDetails: 1,
            status: 1,
            buyingPrice: 1,
            sellingPrice: 1,
            orderId: 1,
            createdAt: 1
          },
        }
      ];

      if (type !== "all") {
        pipeline.push({ $skip: page * limit }, { $limit: limit });
      }

      const vendorDtls = await Vendorpurchase.aggregate(pipeline);

      // Post-processing: enrich each product with attributes
      for (const vendor of vendorDtls) {
        for (const prodItem of vendor.products) {
          const product = vendor.productDetails.find(
            (p: any) => p._id.toString() === prodItem.id.toString()
          );
          if (!product) continue;

          const attrSource = type === 'customer' ? product.customerAttribute : product.wholesalerAttribute;
          const matchedRow = attrSource?.rowData?.find((row: any) =>
            Object.entries(prodItem.attributes || {}).every(([key, val]) => row[key] === val)
          );

          let attributeData: any[] = [];

          if (matchedRow) {
            for (const [key, val] of Object.entries(matchedRow)) {
              if (
                typeof val === 'string' &&
                Types.ObjectId.isValid(val) &&
                !['stock', 'maxLimit', 'sku', 'price'].includes(key)
              ) {
                const valObjId = new Types.ObjectId(val);
                const attr = await Attribute.findOne(
                  { "value._id": valObjId },
                  {
                    name: 1,
                    value: { $elemMatch: { _id: valObjId } }
                  }
                ).lean();

                if (attr && attr.value && attr.value.length > 0) {
                  const valData: any = attr.value[0];
                  const stock = matchedRow.stock ? Number(matchedRow.stock) : undefined;
                  const maxLimit = matchedRow.maxLimit ? Number(matchedRow.maxLimit) : undefined;

                  if (stock !== undefined) valData.stock = stock;
                  if (maxLimit !== undefined) valData.maxLimit = maxLimit;

                  attributeData.push({
                    _id: attr._id,
                    name: attr.name,
                    value: [valData]
                  });
                }
              }
            }
          }

          prodItem.attributeData = attributeData;
          prodItem.productName = product.productName;
        }
      }

      const count = await Vendorpurchase.countDocuments(query);
      return Pagination(count, vendorDtls, limit, page);
    } catch (error: any) {
      return createErrorResponse(
        "33",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

}

export function NewVendorRepository(db: any): VendorDomainRepository {
  return new VendorRepository(db);
}
