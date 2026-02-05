import { Types } from "mongoose";
import { IVendorpurchaseRepository } from "../../../domain/admin/purchaseDomain";
import { CreatePurchaseInput, UpdatePurchaseInput } from "../../../api/Request/purchase";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import Vendorpurchase from "../../../app/model/vendor.purchase";
import { ProductModel } from "../../../app/model/product";
import { VendorListParams, VendorPayments } from "../../../api/Request/vendor";
import Vendor from "../../../app/model/vendor";

export class PurchaseRepository implements IVendorpurchaseRepository {
  private col: any;

  constructor(db: any) {
    this.col = db;
  }
  async generateInvoiceId(): Promise<string> {
    const now = new Date();
    const yyyyMMdd = now.toISOString().split('T')[0].replace(/-/g, '');

    const randomNumber = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random number
    return `nalsuvai_invoice_${yyyyMMdd}-${randomNumber}`;
  }
  async createVendorpurchase(data: CreatePurchaseInput): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      // Generate invoice ID and order code
      const invoiceId = await this.generateInvoiceId();
      const orders = await Vendorpurchase.find({ isActive: 1, isDelete: 0 }).sort({ createdAt: -1 });
      const code = `ORD-${String((orders.length ?? 0) + 1).padStart(3, '0')}`;

      // Set order ID and invoice ID
      data.orderId = code;
      data.invoiceId = invoiceId;

      // Create the purchase with both orderId and invoiceId
      const item = await Vendorpurchase.create(data);
      return successResponse("Purchase created", StatusCodes.CREATED, item);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async getVendorpurchaseById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const purchase = await Vendorpurchase.findOne({ _id: id, isActive: 1, isDelete: 0 });
      if (!purchase) {
        return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      }
      return successResponse("Purchase details got success", StatusCodes.OK, purchase);

    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async getAllVendorpurchases(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<PaginationResult<any> | ErrorResponse> {
    const {
      limit,
      page,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = options;

    try {
      const pageNumber = Math.max(0, page ?? 0);
      const sortOrder = order === "desc" ? -1 : 1;

      const pipeline: any[] = [];

      pipeline.push(
        {
          $match: {
            $and: [{ isActive: true, isDelete: false }]
          }
        },
        {
          $lookup: {
            from: 'vendors',
            localField: 'vendorId',
            foreignField: '_id',
            as: 'vendors'
          }
        },
        {
          $project: {
            vendorId: 1,
            products: 1,
            status: 1,
            orderId: 1,
            totalPrice: 1,
            createdBy: 1,
            modifiedBy: 1,
            isDelete: 1,
            isActive: 1,
            vendorName: { $arrayElemAt: ['$vendors.name', 0] },
            _id: 1,
            createdAt: 1,
            invoiceId: 1
          }
        },
      );
      console.log(search, 'search');

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { vendorName: { $regex: search, $options: "i" } },
              { orderId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } }
            ]
          },
        });
      }

      const countPipeline = [...pipeline, { $count: "total" }];
      const dataPipeline = [
        ...pipeline,
        { $skip: pageNumber * (limit ?? 0) },
        { $limit: limit },
        {
          $sort: {
            createdAt: -1,
          },
        }
      ];

      const [countResult, dataResult] = await Promise.all([
        Vendorpurchase.aggregate(countPipeline),
        Vendorpurchase.aggregate(dataPipeline),
      ]);

      const total = countResult[0]?.total || 0;
      const finalResult = await Promise.all(
        dataResult.map(async (val) => {
          const products = await Promise.all(
            val.products.map(async (data: any) => {
              const product = await ProductModel.findOne({ _id: new Types.ObjectId(data.id) });
              return {
                ...data,
                productName: product?.productName ?? '',
              };
            })
          );

          return {
            ...val,
            products,
          };
        })
      );

      return Pagination(total, finalResult, limit ?? 0, pageNumber);
    } catch (err: any) {
      return createErrorResponse(
        err.message || "Failed to fetch vendor purchases",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateVendorpurchase(
    id: string,
    data: UpdatePurchaseInput
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const updatedPurchase = await Vendorpurchase.findOneAndUpdate(
        { _id: id, isActive: 1, isDelete: 0 },
        { $set: data },
        { new: true }
      );

      if (!updatedPurchase) {
        return createErrorResponse("Purchase not found or inactive", StatusCodes.NOT_FOUND);
      }

      if (data.products) {
        for (const val of data.products) {
          try {
            const product = await ProductModel.findById(val.id);
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
                  attributeData.rowData[i].stock = (currentStock + val.quantityReceived).toString();
                  attributeData.rowData[i].price = (val.sellingPrice).toString();

                  break; // Exit loop after finding the exact match
                }
              }
            }

            await ProductModel.findByIdAndUpdate(
              { _id: product._id },
              { $set: product }
            );

          } catch (error) {
            console.error(`Error updating product ${val.id}:`, error);
            // Handle error appropriately
          }
        }
      }
      console.log("enter last");


      return successResponse("Purchase updated successfully", StatusCodes.OK, updatedPurchase);
    } catch (err: any) {
      return createErrorResponse(
        err.message || "Internal server error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteVendorpurchase(id: string, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const deletedPurchase = await Vendorpurchase.findOneAndUpdate(
        { _id: id, isActive: 1, isDelete: 0 },
        { $set: { isDelete: 1, modifiedBy: new Types.ObjectId(userId) } },
        { new: true }
      );

      if (!deletedPurchase) {
        return createErrorResponse("Purchase not found or already deleted", StatusCodes.NOT_FOUND);
      }

      return successResponse("Purchase deleted successfully", StatusCodes.OK, deletedPurchase);
    } catch (err: any) {
      return createErrorResponse(
        err.message || "Internal server error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getVendorPaymentList(params: VendorListParams) {
    try {
      const matchStage: any = {
        isActive: true,
        isDelete: false,
      };

      if (params?.vendorId) {
        matchStage.vendorId = new Types.ObjectId(params.vendorId);
      }

      if (params?.startDate && params?.endDate) {
        matchStage.createdAt = {
          $gte: new Date(`${params?.startDate}T00:00:00.000Z`),
          $lte: new Date(`${params?.endDate}T23:59:59.999Z`),
        };
      }

      // Get total count
      const count = await Vendorpurchase.countDocuments(matchStage);


      // Main aggregation pipeline
      const pipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendors",
          },
        },
        {
          $unwind: {
            path: "$vendors",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            status: { $first: '$status' },
            orderId: { $first: '$orderId' },
            totalPrice: { $first: '$totalPrice' },
            createdBy: { $first: '$createdBy' },
            modifiedBy: { $first: '$modifiedBy' },
            isDelete: { $first: '$isDelete' },
            isActive: { $first: '$isActive' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' },
            amountPaid: { $first: '$amountPaid' },
            amountPending: { $first: '$amountPending' },
            paymentMode: { $first: '$paymentMode' },
            paymentHistory: { $first: '$paymentHistory' },
            vendorName: { $first: '$vendors.name' },
            totalAmountPurchased: { $sum: "$totalPrice" },
            totalAmountPending: { $sum: "$amountPending" },
            totalAmountPaid: { $first: '$amountPaid' },

          }
        },
        {
          $project: {
            status: 1,
            orderId: 1,
            totalPrice: 1,
            createdBy: 1,
            modifiedBy: 1,
            isDelete: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            amountPaid: 1,
            amountPending: 1,
            paymentMode: 1,
            paymentHistory: 1,
            vendorName: 1,
            totalAmountPurchased: 1,
            totalAmountPending: 1,
            totalAmountPaid: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      // Pagination
      const page = +params.page || 0;
      const limit = +params.limit || 0;

      if (limit > 0) {
        pipeline.push(
          { $skip: page * limit },
          { $limit: limit }
        );
      }

      const result = await Vendorpurchase.aggregate(pipeline).exec();
      let totalAmountPurchased = 0;
      let totalAmountPending = 0
      let totalAmountPaid = 0
      const finalResult = result
        ? await Promise.all(
          result.map(async (val) => {
            if (params.vendorId) {
              totalAmountPurchased += val.totalAmountPurchased || 0;
              totalAmountPending += val.totalAmountPending || 0;
              totalAmountPaid += val.totalAmountPaid || 0;
            }

            return {
              ...val,
              totalAmountPurchased,
              totalAmountPending,
              totalAmountPaid
            };
          })
        )
        : [];

      // Now totalAmountPurchased has the accumulated value

      // Return with Pagination + Total Pending Amount
      return Pagination(count, finalResult, limit, page);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to get vendor payment list",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updatePayment(purchaseId: string, params: VendorPayments) {
    try {
      const purchase = await Vendorpurchase.findOne({
        _id: new Types.ObjectId(purchaseId),
        isActive: true,
        isDelete: false,
      });

      if (!purchase) {
        return createErrorResponse("Purchase not found", StatusCodes.BAD_REQUEST);
      }

      const paid = (purchase.amountPaid ?? 0) + +params.amount;
      const total = purchase.totalPrice ?? 0;

      //  Overpayment check
      if (paid > total) {
        return createErrorResponse(
          "Payment amount exceeds the total purchase amount",
          StatusCodes.BAD_REQUEST
        );
      }

      const pending = total - paid;

      let status = "Pending";
      if (paid === total) {
        status = "Paid";
      } else if (paid > 0) {
        status = "Partially Paid";
      }

      const update = await Vendorpurchase.updateOne(
        { _id: new Types.ObjectId(purchaseId) },
        {
          $set: {
            amountPaid: paid,
            amountPending: pending,
            paymentMode: params.paymentMode,
            paymentStatus: status,
            modifiedBy: new Types.ObjectId(params.modifiedBy),
          },
          $push: {
            paymentHistory: {
              amountPaid: paid,
              amountPending: pending,
              date: new Date(),
            },
          },
        }
      );

      return successResponse("Payment updated successfully", StatusCodes.OK, update);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to update vendor payment",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getVendorPaymentDues(params: VendorListParams) {
    try {
      const matchStage: any = {
        isActive: true,
        isDelete: false,
      };

      if (params?.vendorId) {
        matchStage._id = new Types.ObjectId(params.vendorId);
      }

      if (params?.startDate && params?.endDate) {
        matchStage.createdAt = {
          $gte: new Date(`${params?.startDate}T00:00:00.000Z`),
          $lte: new Date(`${params?.endDate}T23:59:59.999Z`),
        };
      }

      // Get total count
      const count = await Vendor.countDocuments(matchStage);

      // Main aggregation pipeline
      const pipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: "vendorpurchases",
            localField: "_id",
            foreignField: "vendorId",
            as: "vendorpurchases",
          },
        },

        {
          $sort: { "vendorpurchases.updatedAt": -1 },
        },
      ];

      // Pagination
      const page = +params.page || 0;
      const limit = +params.limit || 0;

      if (limit > 0) {
        pipeline.push(
          { $skip: page * limit },
          { $limit: limit }
        );
      }

      const result = await Vendor.aggregate(pipeline).exec();

      const finalResult = result
        ? await Promise.all(
          result.map(async (val) => {
            let totalAmountPurchased = 0;
            let totalAmountPending = 0;
            let totalAmountPaid = 0;
            if (!val.vendorpurchases) return;
            for (const data of val.vendorpurchases) {
              totalAmountPurchased += data.totalPrice || 0;
              totalAmountPending += data.amountPending || 0;
              totalAmountPaid += data.amountPaid || 0;
            }

            return {
              ...val,
              totalAmountPurchased,
              totalAmountPending,
              totalAmountPaid,
              paymentDate: val.vendorpurchases?.[0]?.paymentHistory?.at(-1)?.date
            };
          })
        )
        : [];

      // Return with Pagination + Total Pending Amount
      return Pagination(count, finalResult, limit, page);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to get vendor payment list",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }


}
export function newVendorPurchaseRepository(db: any): IVendorpurchaseRepository {
  return new PurchaseRepository(db);
}
