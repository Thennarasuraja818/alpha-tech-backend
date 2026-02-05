import { IWholesaleOrderRepository, WholesaleOrderParams } from "../../../domain/admin/wholesaleOrderDomain";
import WholesaleOrder, {
  IWholesaleOrder,
} from "../../../app/model/wholesaleOrder";
import {
  CreateWholesaleOrderInput,
  UpdateWholesaleOrderInput,
} from "../../../api/Request/wholesaleOrder";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { StatusCodes } from "http-status-codes";
import { OrderModel } from "../../../app/model/order";
import { Types } from 'mongoose';
import { ProductModel } from "../../../app/model/product";
import Attribute from "../../../app/model/attribute";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import Users from "../../../app/model/user";
import Category from '../../../app/model/category';
import { ReviewModel } from "../../../app/model/review";
import { date } from "zod";
import { CreditAmountDetails, OrderWholesalerDetails } from "../../../api/response/wholesaler.order.response";
import { RootModel } from "../../../app/model/root";
import AdminUsers from "../../../app/model/admin.user";
import { ReturnOrderModel } from "../../../app/model/ReturnOrder";
import moment from 'moment';
import { WholeSalerCreditModel } from '../../../app/model/wholesaler.credit';
import { Uploads } from "../../../utils/uploads/image.upload";
import Admin from "../../../app/model/admin";
import { insertNotification } from "../../../utils/uploads/deliverypushNotification.Service";
import { TripSheetModel } from "../../../app/model/tripsheet";
import mongoose from "mongoose";
import { StockTransaction } from "../../../app/model/stockTransaction";
import Brand from "../../../app/model/brand";
import subcategory from "../../../app/model/subcategory";
import childCategory from "../../../app/model/childCategory";

export class WholesaleOrderRepository implements IWholesaleOrderRepository {
  async findCreditOrderDetailsForPaymentDue(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse> {
    try {

      const { page, limit, id, type } = params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const matchStage: any = {
        isDelete: false,
      };



      if (type == 'Wholesaler' || type == 'Retailer') {
        matchStage.customerType = type;
      }

      const pipeline: any = [
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: "wholesalercredits",
            let: {
              wholesalerId: "$_id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$wholeSalerId",
                          "$$wholesalerId"
                        ]
                      },
                      {
                        $eq: ["$isActive", true]
                      }
                    ]
                  }
                }
              }
            ],
            as: "wholesalercreditsDtls"
          }
        },
        {
          $addFields: {
            creditPeriod: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    "$wholesalercreditsDtls.creditPeriod",
                    0
                  ]
                },
                "0"
              ]
            },
            creditLimit: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    "$wholesalercreditsDtls.creditLimit",
                    0
                  ]
                },
                "0"
              ]
            }
          }
        },
        {
          $addFields: {
            creditPeriod: {
              $toInt: "$creditPeriod"
            },
            creditLimit: {
              $toDouble: "$creditLimit"
            }
          }
        },
        {
          $addFields: {
            dueDate: {
              $add: [
                "$createdAt",
                {
                  $multiply: ["$creditPeriod", 86400000]
                }
              ]
            },
            dueDateMinus7: {
              $subtract: [
                {
                  $add: [
                    "$createdAt",
                    {
                      $multiply: [
                        "$creditPeriod",
                        86400000
                      ]
                    }
                  ]
                },
                604800000
              ]
            }
          }
        },
        // {
        //   $match: {
        //     dueDateMinus7: {
        //       $gte: today,
        //       $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // today + 1 day
        //     }
        //   }
        // },
        {
          $lookup: {
            from: "orders",
            let: {
              userId: "$_id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$placedBy", "$$userId"]
                      },
                      {
                        $eq: ["$paymentMode", "CREDIT"]
                      },
                      {
                        $in: [
                          "$paymentStatus",
                          [
                            "pending",
                            "partially-paid",
                            "paid"
                          ]
                        ]
                      },
                      {
                        $eq: ["$isDelete", false]
                      },
                      {
                        $ne: ["$amountPending", 0]
                      } // only unpaid/partial
                    ]
                  }
                }
              }
            ],
            as: "ordersData"
          }
        },
        {
          $unwind: "$ordersData"
        },
        {
          $addFields: {
            usedCreditAmount: {
              $ifNull: ["$ordersData.totalAmount", 0]
            },
            paidAmount: {
              $ifNull: ["$ordersData.amountPaid", 0]
            },
            remaingAmountToPay: {
              $ifNull: ["$ordersData.amountPending", 0]
            },
            orderCode: "$ordersData.orderCode",
            paymentStatus: "$ordersData.paymentStatus",
            status: "$ordersData.status",
            orderDate: "$ordersData.createdAt",
            availableCreditAmount: {
              $subtract: [
                "$creditLimit",
                {
                  $ifNull: [
                    "$ordersData.totalAmount",
                    0
                  ]
                }
              ]
            }
          }
        },
        {
          $match: {
            remaingAmountToPay: { $ne: 0 }
          }
        },
        {
          $project: {
            name: 1,
            orderCode: 1,
            customerType: 1,
            paymentStatus: 1,
            status: 1,
            creditPeriod: 1,
            creditLimit: 1,
            usedCreditAmount: 1,
            paidAmount: 1,
            availableCreditAmount: 1,
            remaingAmountToPay: 1,
            orderDate: 1
          }
        },
        {
          $sort: {
            orderDate: -1
          }
        },
        {
          $skip: page * limit
        },
        {
          $limit: limit
        }
      ]

      const orderDtlsOfWholesaler = await WholesalerRetailsers.aggregate(pipeline);
      console.log("orderDtlsOfWholesaler9875387654", orderDtlsOfWholesaler)
      const countResult = await OrderModel.countDocuments(matchStage);

      return Pagination(countResult, orderDtlsOfWholesaler, limit ?? 0, page ?? 0);

    } catch (error: any) {
      return createErrorResponse(
        'Error wholesaler credit order not found',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async generateInvoiceId(): Promise<string> {
    const latestInvoice = await OrderModel.aggregate([
      {
        $match: {
          isActive: true,
          isDelete: false, orderFrom: { $ne: "pos" }, invoiceId: { $ne: "" }
        }
      },
      {
        $project: {
          invoiceId: 1,
          numberPart: {
            $toInt: { $replaceAll: { input: "$invoiceId", find: "ND-", replacement: "" } }
          }
        }
      },
      { $sort: { numberPart: -1 } },
      { $limit: 1 }
    ]);
    let count = 1;
    if (latestInvoice.length > 0) {
      count = latestInvoice[0].numberPart + 1;
    }

    return `ND-${count}`;
  }
  async findCreditOrderDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse> {
    try {
      const { page, limit, id, type } = params;

      const matchStage: any = {
        isDelete: false,
      };

      if (id) {
        matchStage.placedBy = new Types.ObjectId(id);
      }


      const pipeline: any = [
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "wholesalerretailers",
            localField: "placedBy",
            foreignField: "_id",
            as: "wholesalerOrderDtls",
          },
        },
        {
          $lookup: {
            from: "wholesalercredits",
            localField: "creditId",
            foreignField: "_id",
            as: "wholesalercreditsDtls",
          },
        },
        {
          $project: {
            name: {
              $ifNull: [{ $arrayElemAt: ["$wholesalerOrderDtls.name", 0] }, ""],
            },
            totalAmount: 1,
            orderCode: 1,
            creditManagement: 1,
            paymentStatus: 1,
            status: 1,
            createdAt: 1,
            creditPeriod: {
              $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditPeriod", 0] }, 0],
            },
            creditLimit: {
              $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditLimit", 0] }, 0],
            },

          },
        },
      ];

      pipeline.push({ $skip: page * limit }, { $limit: limit });

      const orderDtlsOfWholesaler = await OrderModel.aggregate(pipeline);

      const result = [];

      for (const element of orderDtlsOfWholesaler) {
        console.log(element, "element");

        let paidAmount = 0;

        // Sum paidAmount from creditManagement (if available)
        if (Array.isArray(element.creditManagement)) {
          for (const cm of element.creditManagement) {
            paidAmount += Number(cm.paidAmount || 0);
          }
        }

        const totalAmount = Number(element.totalAmount || 0);
        const creditLimit = Number(element.creditLimit || 0);

        const remaingAmountToPay = Math.max(0, totalAmount - paidAmount);
        const availableCreditAmount = Math.max(0, creditLimit - paidAmount);

        const obj = {
          name: element.name ?? '',
          orderCode: element.orderCode ?? '',
          paymentStatus: element.paymentStatus ?? '',
          status: element.status ?? '',
          creditPeriod: element.creditPeriod ?? 0,
          creditLimit: creditLimit,
          usedCreditAmount: totalAmount,
          paidAmount: paidAmount,
          availableCreditAmount: availableCreditAmount,
          remaingAmountToPay: remaingAmountToPay,
          orderDate: element.createdAt ?? ''
        };

        result.push(obj);
      }

      const countResult = await OrderModel.countDocuments(matchStage);

      return Pagination(countResult, result, limit ?? 0, page ?? 0);

    } catch (error: any) {
      return createErrorResponse(
        'Error wholesaler credit order not found',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findCreditDetails(params: WholesaleOrderParams): Promise<PaginationResult<CreditAmountDetails> | ErrorResponse> {
    try {
      const { page, limit, id, type } = params;

      const matchStage: any = {
        isDelete: false,
      };

      if (id) {
        matchStage.id = id;
      }

      if (type == 'Wholesaler' || type == 'Retailer') {
        matchStage.customerType = type;
      }

      const pipeline: any = [
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "wholesalercredits",
            let: { wholesalerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$wholeSalerId", "$$wholesalerId"] },
                      { $eq: ["$isActive", true] }
                    ]
                  }
                }
              }
            ],
            as: "wholesalercreditsDtls"
          }
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "placedBy",
            as: "wholesalerOrderDtls",
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "placedBy",
            as: "wholesalerOrderDtls",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            totalAmount: 1,
            orderCode: 1,
            creditManagement: 1,
            paymentStatus: 1,
            status: 1,
            creditPeriod: {
              $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditPeriod", 0] }, 0],
            },
            creditLimit: {
              $ifNull: [{ $arrayElemAt: ["$wholesalercreditsDtls.creditLimit", 0] }, 0],
            },

            // Filter pending/partially-paid CREDIT orders
            wholesalerOrderDtls: {
              $filter: {
                input: "$wholesalerOrderDtls",
                as: "order",
                cond: {
                  $and: [
                    { $eq: ["$$order.paymentMode", "CREDIT"] },
                    { $in: ["$$order.paymentStatus", ["pending", "partially-paid"]] },
                  ],
                },
              },
            },

            // Find the latest payment date from paid CREDIT orders
            lastPaidedDate: {
              $max: {
                $map: {
                  input: {
                    $filter: {
                      input: "$wholesalerOrderDtls",
                      as: "order",
                      cond: {
                        $and: [
                          { $eq: ["$$order.paymentMode", "CREDIT"] },
                          { $eq: ["$$order.paymentStatus", "paid"] },
                        ],
                      },
                    },
                  },
                  as: "paidOrder",
                  in: "$$paidOrder.updatedAt",
                },
              },
            },
          },
        }

      ];

      pipeline.push({ $skip: page * limit }, { $limit: limit });

      const orderDtlsOfWholesaler = await WholesalerRetailsers.aggregate(pipeline);

      const result = [];


      for (const element of orderDtlsOfWholesaler) {
        let usedCreditAmount = 0;
        let paid = 0;
        let paidAmount = 0
        let paidDate = ""
        console.log(element, "elementelementelement");

        // Sum of totalAmount from filtered CREDIT orders
        if (Array.isArray(element.wholesalerOrderDtls)) {
          for (const order of element.wholesalerOrderDtls) {
            usedCreditAmount += Number(order.totalAmount || 0);
            paidAmount += Number(order.amountPaid || 0)
            // If creditManagement exists on each order, sum its paidAmount
            if (Array.isArray(order.creditManagement)) {
              for (const cm of order.creditManagement) {
                console.log(cm, "cmcmcmcm");
                paidDate = cm.paidDateAndTime
                paid += Number(cm.paidAmount || 0);
              }
            }
          }
        }

        const creditLimit = Number(element.creditLimit || 0);
        const availableCreditAmount = Math.max(0, creditLimit - usedCreditAmount);

        const obj = {
          id: element._id ?? '',
          name: element.name ?? '',
          orderCode: element.orderCode ?? '',
          paymentStatus: element.paymentStatus ?? '',
          status: element.status ?? '',
          creditPeriod: element.creditPeriod ?? 0,
          creditLimit: creditLimit,
          lastPaidedDate: paidDate ? paidDate.toString() : element.lastPaidedDate?.toString() ?? '',
          usedCreditAmount: Math.max(0, usedCreditAmount - paidAmount),
          paidAmount: paid,
          availableCreditAmount: Math.max(0, creditLimit - (usedCreditAmount - paidAmount)),
          remaingAmountToPay: Math.max(0, usedCreditAmount - paid),
        };

        result.push(obj);
      }



      const countResult = await WholesalerRetailsers.countDocuments(matchStage);

      return Pagination(countResult, result, limit ?? 0, page ?? 0);

    } catch (error: any) {
      return createErrorResponse(
        'Error wholesaler credit order not found',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findOrderOfWholesaler(params: WholesaleOrderParams): Promise<PaginationResult<OrderWholesalerDetails> | ErrorResponse> {
    try {
      const { page, limit, id, search } = params;

      const matchStage: any = {
        //  isActive: true,
        isDelete: false,
      };

      if (id) {
        matchStage.id = id
      }

      const pipeline = []
      pipeline.push(
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: "wholesalercredits",
            localField: "creditManagement.creditId",
            foreignField: "_id",
            as: "wholesalercreditsDtls"
          }
        }, {
        $project: {
          totalAmount: 1,
          orderCode: 1,
          creditManagement: 1,
          paymentStatus: 1,
          status: 1,
          creditPeriod: { $arrayElemAt: ["$wholesalercreditsDtls.creditPeriod", 0] },
          creditLimit: { $arrayElemAt: ["$wholesalercreditsDtls.creditLimit", 0] },
        }
      }
      )
      const orderDtlsOfWholesaler = await OrderModel.aggregate(pipeline);

      const result = []
      for (const element of orderDtlsOfWholesaler) {
        let paid = 0;

        // Sum up all paid amounts
        for (const e of element.creditManagement || []) {
          paid += Number(e.paidAmount || 0);
        }

        const obj = {
          totalAmount: element.totalAmount,
          orderCode: element.orderCode,
          paymentStatus: element.paymentStatus,
          status: element.status,
          creditPeriod: element.creditPeriod,
          creditLimit: element.creditLimit,
          paidAmount: paid,
          remaining: Number(element.creditLimit || 0) - paid
        };

        result.push(obj);
      }
      const countResult = await ProductModel.countDocuments(matchStage);

      return Pagination(countResult, result, limit ?? 0, page ?? 0);

    } catch (error: any) {
      return createErrorResponse(
        'Error wholesaler order not found',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findIsOrderExist(id: string): Promise<Boolean | ErrorResponse> {
    try {

      const count = await OrderModel.countDocuments({
        _id: new Types.ObjectId(id),
      });

      return count === 1;

    } catch (error: any) {
      return createErrorResponse(
        'Error order not found',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async updateOrderStatus(id: string, status: string, userId: string, paymentStatus: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {

      const update = await OrderModel.updateOne({
        _id: new Types.ObjectId(id)
      }, {
        status: status.toLowerCase(),
        paymentStatus: paymentStatus,
        modifiedBy: new Types.ObjectId(userId)
      })

      if (!update) {
        return createErrorResponse(
          'Order error in stautus update',
          StatusCodes.NOT_FOUND,
          'Order error in stautus update'
        );
      }
      return successResponse("Order updated to next stage successfully", StatusCodes.OK, { message: "" });

    } catch (error: any) {
      return createErrorResponse(
        'Error update order status',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async createOrder(
    data: CreateWholesaleOrderInput
  ): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse> {
    try {

      const order = await WholesaleOrder.create(data as any);
      return successResponse("Order created", StatusCodes.CREATED, order);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getOrderById(
    id: string
  ): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse> {
    try {
      const order = await WholesaleOrder.findById(id);
      if (!order)
        return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Order fetched", StatusCodes.OK, order);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async approvedUpdateOrderStatus(
    id: string,
    status: string,
    userId: string,
    reason?: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(reason, "reason received");
      // 1. Check order
      const order = await OrderModel.findOne({
        _id: new Types.ObjectId(id),
        isDelete: false
      }).session(session);

      const newStatus = status.toLowerCase();

      if (!order) {
        await session.abortTransaction();
        return createErrorResponse(
          'Order not found',
          StatusCodes.BAD_REQUEST,
          'Error order not found'
        );
      }

      if (!status) {
        await session.abortTransaction();
        return createErrorResponse(
          'Invalid status',
          StatusCodes.BAD_REQUEST,
          'Status is required for approval update'
        );
      }

      const wholesalerId = order.placedBy;

      // 2. Check admin access with orderStatusChangePermission (only for pending to packed)
      const isAdmin = await Admin.findOne({
        _id: new Types.ObjectId(userId),
        isDelete: false
      });

      const isSpecialUser = await AdminUsers.findOne({
        _id: new Types.ObjectId(userId),
        isDelete: false,
        orderStatusChangePermission: true
      });

      // Handle status transitions with business logic
      let updateApprovalData: any = {
        modifiedBy: new Types.ObjectId(userId),
        status: newStatus,
        updatedAt: new Date()
      };

      // Check pending credit only for pending→packed transition
      if (order.status === "pending" && newStatus === "packed") {
        const pendingCreditOrders = await OrderModel.find({
          placedBy: wholesalerId,
          _id: { $ne: id },
          paymentStatus: { $ne: 'paid' },
          paymentMode: 'CREDIT',
          status: { $nin: ['cancelled', 'reorder'] },
          createdAt: { $lt: order.createdAt }
        }).session(session);

        if (pendingCreditOrders.length > 0) {
          // If pending credit exists, require admin/special user permission
          if (!isAdmin && !isSpecialUser) {
            await session.abortTransaction();
            return createErrorResponse(
              'Forbidden',
              StatusCodes.FORBIDDEN,
              'Pending credit exists. You do not have permission to change order status'
            );
          }
        }
        // If no pending credit, allow any user (no permission check needed)
      }

      // Case 1: From cancelled to pending/packed (no stock update needed)
      if (order.status === 'cancelled' && (newStatus === 'pending' || newStatus === 'packed')) {
        if (!order.invoiceId || order.invoiceId === "") {
          updateApprovalData.status = 'pending';
        } else {
          updateApprovalData.status = 'packed';
        }

        // Clear cancellation related fields
        updateApprovalData.cancelledDate = null;
        updateApprovalData.cancelReason = '';
        if (!isAdmin && !isSpecialUser) {
          await session.abortTransaction();
          return createErrorResponse(
            'Forbidden',
            StatusCodes.FORBIDDEN,
            'You do not have permission to change order status'
          );
        }
        // NO STOCK UPDATE: Order was cancelled, never packed, so no stock was reduced
      }

      // Case 2: From delivered/shipped to packed (with customer not available or wrongly changed)
      else if ((order.status === 'delivered' || order.status === 'shipped') && newStatus === 'packed') {
        // Validate reason
        if (!isAdmin && !isSpecialUser) {
          await session.abortTransaction();
          return createErrorResponse(
            'Forbidden',
            StatusCodes.FORBIDDEN,
            'You do not have permission to change order status'
          );
        }

        if (!reason) {
          await session.abortTransaction();
          return createErrorResponse(
            'Reason required',
            StatusCodes.BAD_REQUEST,
            'Reason is required for changing status from ' + order.status + ' to packed'
          );
        }

        const allowedReasons = ['customer not available', 'wrongly changed'];
        if (!allowedReasons.includes(reason.toLowerCase().trim())) {
          await session.abortTransaction();
          return createErrorResponse(
            'Invalid reason',
            StatusCodes.BAD_REQUEST,
            'Reason must be "customer not available" or "wrongly changed"'
          );
        }

        // Handle customer not available scenario
        if (reason.toLowerCase().trim() === 'customer not available') {
          // Update current trip sheet
          await TripSheetModel.updateOne(
            {
              orderId: order._id,
              status: order.status === "shipped" ? 'assigned' : "completed",
              isActive: true
            },
            {
              $set: {
                status: 'customer not available',
                completedDate: new Date(),
                reason: 'customer not available'
              }
            }
          ).session(session);

          // Reset order assignment but keep history
          const resetPayload: any = {
            status: 'packed',
            deliveryman: null,
            incharge: null,
            loadman: [],
            vehicleId: null,
            kilometer: null,
            WorkerAssignDate: null,
            otp: null,
            modifiedBy: new Types.ObjectId(userId),
            updatedAt: new Date()
          };

          await OrderModel.updateOne(
            { _id: order._id },
            { $set: resetPayload },
            { session }
          );

          // NO STOCK RETURN: Stock was already reduced when order was packed initially
          await session.commitTransaction();
          return successResponse(
            "Order marked as customer not available",
            StatusCodes.OK,
            {
              message: "Order can be reassigned later",
              canReassign: true
            }
          );
        }

        // Handle wrongly changed scenario
        else if (reason.toLowerCase().trim() === 'wrongly changed') {
          // Deactivate current trip sheet
          await TripSheetModel.updateOne(
            {
              orderId: order._id,
              status: order.status === "shipped" ? 'assigned' : "completed",
              isActive: true
            },
            {
              $set: {
                isActive: false,
                updatedAt: new Date()
              }
            }
          ).session(session);

          // Reset order assignment
          const resetPayload: any = {
            status: 'packed',
            deliveryman: null,
            incharge: null,
            loadman: [],
            vehicleId: null,
            kilometer: null,
            WorkerAssignDate: null,
            otp: null,
            modifiedBy: new Types.ObjectId(userId),
            updatedAt: new Date()
          };

          updateApprovalData = { ...updateApprovalData, ...resetPayload };

          // NO STOCK RETURN: Stock was already reduced when order was packed initially
        }
      }

      // Case 3: From shipped to delivered
      else if (order.status === 'shipped' && newStatus === 'delivered') {
        // Update trip sheet
        if (!isAdmin && !isSpecialUser) {
          await session.abortTransaction();
          return createErrorResponse(
            'Forbidden',
            StatusCodes.FORBIDDEN,
            'You do not have permission to change order status'
          );
        }
        await TripSheetModel.updateOne(
          {
            orderId: order._id,
            status: 'assigned',
            isActive: true
          },
          {
            $set: {
              status: 'completed',
              completedDate: new Date()
            }
          }
        ).session(session);

        const deliveryPayload: any = {
          status: 'delivered',
          modifiedBy: new Types.ObjectId(userId),
          deliveredDate: new Date()
        };

        updateApprovalData = { ...updateApprovalData, ...deliveryPayload };
        // NO STOCK UPDATE: Moving from shipped to delivered doesn't affect stock
      }

      // ✅ STOCK MANAGEMENT: ONLY when order is pending → packed
      else if (order.status === 'pending' && newStatus === 'packed') {
        // Generate invoice if not exists
        if (!order.invoiceId || order.invoiceId === "") {
          const invoiceId = await this.generateInvoiceId();
          updateApprovalData.invoiceId = invoiceId;
        }
        updateApprovalData.packedDate = new Date();

        // ✅ REDUCE STOCK: Only for pending → packed transition
        for (const item of order.items) {
          if (item.productId) {
            // Check if product exists and has enough stock
            const product: any = await ProductModel.findOne({
              _id: item.productId,
              isActive: true,
              isDelete: false
            }).session(session);

            if (!product) {
              await session.abortTransaction();
              return createErrorResponse(
                "Product not found",
                StatusCodes.NOT_FOUND,
                `Product with ID ${item.productId} not found`
              );
            }

            // if (product.stock < item.quantity) {
            //   await session.abortTransaction();
            //   return createErrorResponse(
            //     "Insufficient stock",
            //     StatusCodes.BAD_REQUEST,
            //     `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`
            //   );
            // }

            // Update product stock (REDUCE stock)
            await ProductModel.updateOne(
              { _id: item.productId },
              { $inc: { stock: -item.quantity } },
              { session }
            );

            // Create stock transaction for order fulfillment
            await StockTransaction.create([{
              productId: item.productId,
              type: 'order',
              quantity: -item.quantity, // Negative because stock is being reduced
              referenceId: order._id,
              referenceModel: 'Order',
              createdBy: new Types.ObjectId(userId),
              remarks: `Order Packed - Order Code: ${order.orderCode}, Invoice: ${updateApprovalData.invoiceId || 'N/A'}`
            }], { session });
          }
        }
      }

      // ✅ STOCK RETURN: ONLY when order is packed → cancelled or packed → pending
      else if (order.status === 'packed' && (newStatus === 'cancelled' || newStatus === 'pending')) {
        if (!isAdmin && !isSpecialUser) {
          await session.abortTransaction();
          return createErrorResponse(
            'Forbidden',
            StatusCodes.FORBIDDEN,
            'You do not have permission to change order status'
          );
        }

        // Set status-specific fields
        if (newStatus === 'cancelled') {
          updateApprovalData.cancelledDate = new Date();
          if (reason) {
            updateApprovalData.cancelReason = reason;
          }
        }

        // Clear packed-related fields when moving back to pending
        if (newStatus === 'pending') {
          updateApprovalData.packedDate = null;
          updateApprovalData.invoiceId = '';
        }

        // ✅ RETURN STOCK: For both packed→cancelled and packed→pending
        for (const item of order.items) {
          if (item.productId) {
            // Update product stock (ADD BACK stock)
            await ProductModel.updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity } },
              { session }
            );

            // Determine transaction remarks based on new status
            let transactionType = '';
            let transactionRemarks = '';

            if (newStatus === 'cancelled') {
              transactionType = 'cancellation';
              transactionRemarks = `Order Cancelled - Order Code: ${order.orderCode}, Invoice: ${order.invoiceId || 'N/A'}, Reason: ${reason || 'No reason provided'}`;
            } else if (newStatus === 'pending') {
              transactionType = 'reversal';
              transactionRemarks = `Order Status Reversed to Pending - Order Code: ${order.orderCode}, Invoice: ${order.invoiceId || 'N/A'}`;
            }

            await StockTransaction.create([{
              productId: item.productId,
              type: 'return',
              quantity: item.quantity, // Positive because stock is being returned
              referenceId: order._id,
              referenceModel: 'Order',
              createdBy: new Types.ObjectId(userId),
              remarks: transactionRemarks
            }], { session });
          }
        }
      }

      // For pending→cancelled (no stock to return - was never packed)
      else if (order.status === 'pending' && newStatus === 'cancelled') {
        updateApprovalData.cancelledDate = new Date();
        if (reason) {
          updateApprovalData.cancelReason = reason;
        }
        // NO STOCK MANAGEMENT: Order was never packed, so no stock was reduced
        // NO permission check needed for pending→cancelled
      }

      // For packed→shipped (no stock update needed)
      else if (order.status === 'packed' && newStatus === 'shipped') {
        updateApprovalData.shippedDate = new Date();
        // NO STOCK UPDATE: Already reduced when packed
      }

      // Set date fields for other status changes
      if (newStatus === 'shipped') {
        updateApprovalData.shippedDate = new Date();
      } else if (newStatus === 'cancelled' && reason) {
        updateApprovalData.cancelReason = reason;
      }

      // ✅ Update the order
      await OrderModel.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: updateApprovalData },
        { session }
      );

      await session.commitTransaction();
      console.log("placeduser33", order.createdBy)
      const placeduser = await AdminUsers.findOne({
        _id: new Types.ObjectId(order.createdBy)
      });
      console.log(placeduser, "placeduser")
      if (placeduser && placeduser.fcmToken) {
        let title = "";
        let msg = "";

        if (newStatus === "packed") {
          title = "Your Order is Packed 📦";
          msg = `Your order (${order.invoiceId || order.orderCode}) has been packed and will be shipped soon.`;
        }

        else if (newStatus === "delivered") {
          title = "Order Delivered Successfully 🚚✨";
          msg = `Your order (${order.invoiceId || order.orderCode}) has been delivered. Thank you for shopping with us! 🙏`;
        }

        else if (newStatus === "cancelled") {
          title = "Order Cancelled ❌";
          msg = `Your order (${order.invoiceId || order.orderCode}) was cancelled. Reason: ${newStatus || "No reason provided"}`;
        }

        else {
          title = "Order Updated 🔄";
          msg = `Your order (${order.invoiceId || order.orderCode}) status changed to: ${newStatus}`;
        }
        await insertNotification("lineman",
          placeduser.fcmToken,
          title,
          msg,
          placeduser._id
        );
      }


      return successResponse(
        'Order status updated successfully',
        StatusCodes.OK,
        {
          message: 'Order status updated',
          stockUpdated: (order.status === 'pending' && newStatus === 'packed') ||
            (order.status === 'packed' && newStatus === 'cancelled')
        }
      );
    } catch (error: any) {
      await session.abortTransaction();
      return createErrorResponse(
        'Error updating order status',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    } finally {
      await session.endSession();
    }
  }
  async getAllWholeSaleorders(options: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
    type?: string
  }): Promise<
    | ApiResponse<{
      items: any;
      total: number;
      limit: number;
      offset: number;
    }>
    | ErrorResponse
  > {

    try {

      const { limit = 10, offset = 0, type } = options;
      const query = { isDelete: false, placedByModel: type };
      // Fetch orders
      const orders = await OrderModel.find(query)
        .skip(offset * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      console.log(type, "typetype");

      // Count total
      const total = await OrderModel.countDocuments(query);

      const itemPromises = orders.map(async (order: any) => {
        console.log(order.placedBy, 'order.placedBy');
        let wholesaler: any;
        if (type == 'User') {
          wholesaler = await Users.findOne({ _id: order.placedBy });

        } else {
          wholesaler = await WholesalerRetailsers.findOne({ _id: order.placedBy });
        }
        const item = order.items?.[0]; // Get first item

        if (!item) return null; // Skip orders without items

        return {
          orderId: order.orderCode,
          _id: order._id,
          customerName: wholesaler?.name || 'N/A',
          customerContact: order.shippingAddress?.contactNumber || 'N/A',
          customerDeliveryAddress: `${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}`,
          customerOrderNotes: '', // Optional
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountApplied: 0,
          totalPrice: item.quantity * item.unitPrice,
          stockLocation: 'Warehouse A',
          paymentMode: order.paymentMode,
          paymentStatus: order.paymentStatus,
          deliveryType: 'Standard',
          deliveryPerson: 'Bob Delivery',
          estimatedDeliveryDate: new Date(),
          deliveryStatus: 'Pending',
          deliveryOrderNotes: 'Leave package by the side gate.',
          createdBy: order.createdBy,
          modifiedBy: order.modifiedBy,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          __v: order.__v,
        };
      });

      const nestedItems = await Promise.all(itemPromises);
      const items = nestedItems.filter(Boolean); // Remove nulls from orders with no items

      // Final response
      return {
        status: 'success',
        statusCode: 200,
        message: 'List fetched',
        data: {
          items,
          total,
          limit,
          offset,
        },
      };

    } catch (e: any) {
      return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }

  async updateOrder(
    id: string,
    data: UpdateWholesaleOrderInput
  ): Promise<ApiResponse<IWholesaleOrder> | ErrorResponse> {
    try {
      const order = await WholesaleOrder.findByIdAndUpdate(id, data as any, {
        new: true,
      });
      if (!order)
        return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Order updated", StatusCodes.OK, order);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteOrder(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      const order = await WholesaleOrder.findByIdAndDelete(id);
      if (!order)
        return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
      return successResponse("Order deleted", StatusCodes.OK, null);
    } catch (err: any) {
      return createErrorResponse(
        err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async deliveryList(params: {
    page: number;
    limit: number;
    type?: string;
    userId: string;
    orderType: string;
    Id: string;
    status?: string;
  }) {
    try {
      const { page, limit, type, orderType, Id, status } = params;

      if (page < 0) {
        throw new Error('Invalid pagination parameters');
      }

      const queryConditions: any = { isDelete: false };

      if (Id) {
        queryConditions.placedBy = new Types.ObjectId(Id);
      }

      if (type === 'customer' || type === 'Customer' || type === 'Wholesaler' || type === 'wholesaler' || type === 'Retailer') {
        const types = type.toLowerCase();
        queryConditions.placedByModel =
          types === 'customer' ? 'User' :
            types === 'wholesaler' ? 'Wholesaler' :
              types === 'retailer' ? 'Retailer' : "";
        queryConditions.orderFrom = { $ne: 'pos' };
      }

      if (type === 'pos') {
        queryConditions.orderFrom = 'pos';
      }

      if (orderType) {
        queryConditions.orderType = orderType;
      }

      if (status === 'delivered') {
        queryConditions.status = 'delivered';
      } else if (status === 'shipped') {
        queryConditions.status = 'shipped';
      } else {
        queryConditions.status = { $in: ['shipped', 'delivered', 'approved'] };
      }

      const total = await OrderModel.countDocuments(queryConditions);
      const skip = page * limit;

      if (skip >= total) {
        return Pagination(total, [], limit, page);
      }

      const orders = await OrderModel.find(queryConditions)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const finalResult = await Promise.all(
        orders.map(async (order) => {
          let userData;
          let deliveryman

          try {
            if (type === 'customer' || type === 'pos') {
              userData = await Users.findOne({
                _id: new Types.ObjectId(order.placedBy),
                isDelete: false,
                isActive: true,
              }).select('name').lean();
            }

            if (type === 'wholesaler' || type === 'retailer') {
              userData = await WholesalerRetailsers.findOne({
                _id: new Types.ObjectId(order.placedBy),
                isDelete: false,
                isActive: true,
              }).select('name').lean();
            }
            const orderPincode = order?.shippingAddress?.postalCode;
            if (orderPincode) {
              const root = await RootModel.findOne({
                isDelete: false,
                isActive: true,
                pincode: { $elemMatch: { code: orderPincode } }
              }).select('deliveryman').lean();
              if (root?.deliveryman) {
                deliveryman = await AdminUsers.findOne({
                  _id: root.deliveryman,
                  isDelete: false,
                  isActive: true,
                }).select('name').lean();
              }
            }
          } catch (error) {
            console.error(`Error processing order ${order._id}:`, error);
          }

          return {
            ...order,
            name: userData?.name ?? '',
            deliveryman: deliveryman?.name ?? '',
          };
        })
      );

      return Pagination(total, finalResult, limit, page);
    } catch (e: any) {
      console.error('Error in deliverylist:', e);
      return createErrorResponse(
        'Delivery List Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
  }
  async deliverymanPerformanceList(params: {
    page: number;
    limit: number;
    fromDate: string;
    toDate: string;
  }) {
    try {
      const { page, limit } = params;
      const now = moment();
      const fromDate = params.fromDate ? new Date(params.fromDate) : now.clone().subtract(1, 'month').startOf('day').toDate();
      const toDate = params.toDate ? new Date(params.toDate) : now.clone().endOf('day').toDate();


      if (page < 0) {
        throw new Error('Invalid pagination parameters');
      }
      const total = await AdminUsers.aggregate([
        {
          $match: {
            isDelete: false
          }
        },
        {
          $lookup: {
            from: "userroles",
            localField: "roleId",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $match: {
            "role.roleName": "Delivery"
          }
        },
        {
          $count: "count"
        }
      ]).then(res => res[0]?.count || 0);

      const deliverymanPerformanceList = await AdminUsers.aggregate([

        {
          $match: {
            isDelete: false
          }
        },
        {
          $lookup: {
            from: "userroles",
            localField: "roleId",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $match: {
            "role.roleName": "Delivery"
          }
        },
        {
          $lookup: {
            from: "roots",
            localField: "_id",
            foreignField: "deliveryman",
            as: "roots"
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            allPincodes: {
              $reduce: {
                input: "$roots",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    {
                      $map: {
                        input: "$$this.pincode",
                        as: "pc",
                        in: "$$pc.code"
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "orders",
            let: {
              pincodes: "$allPincodes",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$isDelete", false]
                      },
                      {
                        $in: [
                          "$shippingAddress.postalCode",
                          "$$pincodes"
                        ]
                      },
                      {
                        $gte: ["$createdAt", fromDate]
                      },
                      {
                        $lte: ["$createdAt", toDate]
                      }
                    ]
                  }
                }
              }
            ],
            as: "orders"
          }
        },
        {
          $lookup: {
            from: "orders",
            let: {
              pincodes: "$allPincodes"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$isDelete", false]
                      },
                      {
                        $eq: ["$status", "delivered"]
                      },
                      {
                        $in: [
                          "$shippingAddress.postalCode",
                          "$$pincodes"
                        ]
                      },
                      {
                        $gte: ["$createdAt", fromDate]
                      },
                      {
                        $lte: ["$createdAt", toDate]
                      }
                    ]
                  }
                }
              }
            ],
            as: "deliveredOrders"
          }
        },
        {
          $project: {
            _id: 1,
            deliverymanName: "$name",
            totalOrders: {
              $size: "$orders"
            },
            totalDelivered: {
              $size: "$deliveredOrders"
            }
          }
        },
        {
          $sort: {
            totalOrders: -1
          }
        },
        {
          $skip: page * limit
        },
        {
          $limit: limit
        }
      ])

      return Pagination(total, deliverymanPerformanceList, limit, page);
    } catch (e: any) {
      console.error('Error in deliverymanPerformanceList:', e);
      return createErrorResponse(
        'Deliveryman Performance List Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
  }
  async deliverymanTopPerformanceList(params: {
    page: number;
    limit: number;
    fromDate: string;
    toDate: string;
  }) {
    try {
      const { page, limit } = params;
      const now = moment();

      const fromDate = params.fromDate ? new Date(params.fromDate) : now.clone().subtract(1, 'month').startOf('day').toDate();
      const toDate = params.toDate ? new Date(params.toDate) : now.clone().endOf('day').toDate();

      if (page < 0) {
        throw new Error('Invalid pagination parameters');
      }
      const total = await AdminUsers.aggregate([
        {
          $match: {
            isDelete: false
          }
        },
        {
          $lookup: {
            from: "userroles",
            localField: "roleId",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $match: {
            "role.roleName": "Delivery"
          }
        },
        {
          $count: "count"
        }
      ]).then(res => res[0]?.count || 0);


      const deliverymanPerformanceList = await AdminUsers.aggregate([

        {
          $match: {
            isDelete: false
          }
        },
        {
          $lookup: {
            from: "userroles",
            localField: "roleId",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $unwind: "$role"
        },
        {
          $match: {
            "role.roleName": "Delivery"
          }
        },
        {
          $lookup: {
            from: "roots",
            localField: "_id",
            foreignField: "deliveryman",
            as: "roots"
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            allPincodes: {
              $reduce: {
                input: "$roots",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    {
                      $map: {
                        input: "$$this.pincode",
                        as: "pc",
                        in: "$$pc.code"
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "orders",
            let: {
              pincodes: "$allPincodes",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$isDelete", false]
                      },
                      {
                        $in: [
                          "$shippingAddress.postalCode",
                          "$$pincodes"
                        ]
                      },
                      {
                        $gte: ["$createdAt", fromDate]
                      },
                      {
                        $lte: ["$createdAt", toDate]
                      }
                    ]
                  }
                }
              }
            ],
            as: "orders"
          }
        },
        {
          $lookup: {
            from: "orders",
            let: {
              pincodes: "$allPincodes"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$isDelete", false]
                      },
                      {
                        $eq: ["$status", "delivered"]
                      },
                      {
                        $in: [
                          "$shippingAddress.postalCode",
                          "$$pincodes"
                        ]
                      },
                      {
                        $gte: ["$createdAt", fromDate]
                      },
                      {
                        $lte: ["$createdAt", toDate]
                      }
                    ]
                  }
                }
              }
            ],
            as: "deliveredOrders"
          }
        },
        {
          $project: {
            _id: 1,
            deliverymanName: "$name",
            totalOrders: {
              $size: "$orders"
            },
            totalDelivered: {
              $size: "$deliveredOrders"
            }
          }
        },
        {
          $sort: {
            totalDelivered: -1
          }
        },
        {
          $skip: page * limit
        },
        {
          $limit: limit
        }
      ])

      return Pagination(total, deliverymanPerformanceList, limit, page);
    } catch (e: any) {
      console.error('Error in deliverymanPerformanceList:', e);
      return createErrorResponse(
        'Deliveryman Performance List Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
  }
  async failedDeliveryList(params: {
    page: number;
    limit: number;
    fromDate: string;
    toDate: string;
  }) {
    try {
      const { page, limit } = params;
      const now = moment();
      const fromDate = params.fromDate ? new Date(params.fromDate) : now.clone().subtract(1, 'month').startOf('day').toDate();
      const toDate = params.toDate ? new Date(params.toDate) : now.clone().endOf('day').toDate();

      if (page < 0) {
        throw new Error('Invalid pagination parameters');
      }
      const total = await OrderModel.countDocuments({
        isDelete: false,
        orderFrom: { $ne: "pos" },
        status: "cancelled",
        createdAt: {
          $gte: fromDate,
          $lte: toDate
        }
      });

      const failedDeliveryList = await OrderModel.aggregate([
        {
          $match: {
            isDelete: false,
            orderFrom: { $ne: "pos" },
            status: "cancelled",
            createdAt: {
              $gte: fromDate,
              $lte: toDate
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "placedBy",
            foreignField: "_id",
            as: "customer"
          }
        },
        { $unwind: "$customer" },
        {
          $lookup: {
            from: "roots",
            let: { pincode: "$shippingAddress.postalCode" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$$pincode", "$pincode.code"]
                  }
                }
              },
              {
                $lookup: {
                  from: "adminusers",
                  localField: "deliveryman",
                  foreignField: "_id",
                  as: "deliveryman"
                }
              },
              { $unwind: "$deliveryman" },
              {
                $lookup: {
                  from: "userroles",
                  localField: "deliveryman.roleId",
                  foreignField: "_id",
                  as: "role"
                }
              },
              { $unwind: "$role" },
              {
                $match: {
                  "role.roleName": "Delivery"
                }
              },
              {
                $project: {
                  _id: 0,
                  deliveryman: {
                    _id: "$deliveryman._id",
                    name: "$deliveryman.name",
                    phone: "$deliveryman.phone"
                  }
                }
              }
            ],
            as: "deliveryDetails"
          }
        },
        {
          $project: {
            _id: 1,
            orderCode: 1,
            createdAt: 1,
            status: 1,
            paymentStatus: 1,
            shippingAddress: 1,
            customerName: "$customer.name",
            customerPhone: "$customer.phone",
            deliveryman: {
              $first: "$deliveryDetails.deliveryman"
            }
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $skip: page * limit
        },
        {
          $limit: limit
        }
      ]
      )

      return Pagination(total, failedDeliveryList, limit, page);
    } catch (e: any) {
      console.error('Error in deliverymanPerformanceList:', e);
      return createErrorResponse(
        'Deliveryman Performance List Error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
  }

  // async orderlists(params: {
  //   page: number;
  //   limit: number;
  //   type?: string;
  //   userId: string;
  //   orderType: string;
  //   Id: string;
  //   status?: string;
  // }) {
  //   try {
  //     const { page, limit, type, orderType, Id, status } = params;

  //     if (page < 0) {
  //       throw new Error('Invalid pagination parameters');
  //     }

  //     const queryConditions: any = { isDelete: false };

  //     if (Id) {
  //       queryConditions.placedBy = new ObjectId(Id);
  //     }
  //     if (type === 'customer' || type === 'Customer' || type === 'Wholesaler' || type === 'wholesaler' || type === 'Retailer' || type === 'retailer') {
  //       const types = type.toLowerCase();
  //       queryConditions.placedByModel =
  //         types === 'customer' ? 'User' :
  //           types === 'wholesaler' ? 'Wholesaler' :
  //             types === 'retailer' ? 'Retailer' : "";
  //       queryConditions.orderFrom = { $ne: 'pos' };
  //     }

  //     if (type === 'pos') {
  //       queryConditions.orderFrom = 'pos';
  //     }

  //     if (orderType !== '' && orderType !== undefined) {
  //       queryConditions.orderType = orderType;
  //     }

  //     if (status && status !== '' && status !== undefined) {
  //       queryConditions.status = status;
  //     }

  //     const total = await OrderModel.countDocuments(queryConditions);
  //     const skip = page * limit;

  //     if (skip >= total) {
  //       return Pagination(total, [], limit, page);
  //     }

  //     const orders = await OrderModel.find(queryConditions)
  //       .skip(skip)
  //       .limit(limit)
  //       .sort({ createdAt: -1 })
  //       .lean();

  //     const finalResult = await Promise.all(
  //       orders.map(async (order: any) => {
  //         let userData;
  //         let customerTotalTax = 0;
  //         let wholesalerTotalTax = 0;
  //         let overDue = false;
  //         let creditDueDate: any;
  //         try {
  //           if (type === 'customer' || type === 'pos') {
  //             userData = await Users.findOne({
  //               _id: new ObjectId(order.placedBy),
  //               isDelete: false,
  //               isActive: true,
  //             }).select('name').lean();
  //           }

  //           if (type === 'wholesaler' || type === 'retailer') {
  //             userData = await WholesalerRetailsers.findOne({
  //               _id: new ObjectId(order.placedBy),
  //               isDelete: false,
  //               isActive: true,
  //             }).select('name').lean();
  //             const checkOverdue = await WholeSalerCreditModel.findOne({
  //               wholeSalerId: order.placedBy,
  //               isActive: true,
  //               isDelete: false
  //             });

  //             if (checkOverdue?.creditPeriod) {
  //               const dueDate = moment(order.createdAt).add(checkOverdue.creditPeriod, 'days');
  //               if (moment().isAfter(dueDate, 'day')) {
  //                 overDue = true;
  //                 creditDueDate = dueDate;
  //               } else {
  //                 creditDueDate = dueDate;
  //               }
  //             }
  //           }
  //         } catch (error) {
  //           console.error(`Error fetching user data for order ${order._id}:`, error);
  //         }

  //         const enhancedProducts = await Promise.all(
  //           order.items.map(async (prod: any) => {
  //             const product = await ProductModel.findOne({
  //               _id: new ObjectId(prod.productId),
  //               isActive: 1,
  //               isDelete: 0
  //             });

  //             if (!product) return null;

  //             const unitPrice = Number(prod.unitPrice || 0);
  //             const quantity = Number(prod.quantity || 0);

  //             const customerTaxRate = Number(product.customerTax || 0) / 100;
  //             const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

  //             const customerTaxPrice = customerTaxRate * unitPrice;
  //             const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;

  //             customerTotalTax += customerTaxPrice * quantity;
  //             wholesalerTotalTax += wholesalerTaxPrice * quantity;


  //           })
  //         );
  //         return {
  //           ...order,
  //           name: userData?.name ?? '',
  //           customerTotalTax,
  //           wholesalerTotalTax,
  //           total: order.totalAmount + (type === 'customer' ? customerTotalTax : wholesalerTotalTax) + (order?.deliveryCharge ?? 0),
  //           subTotal: order.totalAmount,
  //           deliveryCharge: (order?.deliveryCharge ?? 0),
  //           overDue,
  //           creditDueDate
  //         };
  //       })
  //     );

  //     return Pagination(total, finalResult, limit, page);
  //   } catch (e: any) {
  //     console.error('Error in orderlists:', e);
  //     return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
  //   }
  // }
  private static calculateTaxFromInclusivePrice(inclusivePrice: number, quantity: number, discount: number, taxRate: number) {
    const itemTax = (((inclusivePrice * quantity) - discount) * taxRate) / 100;

    return {
      itemTax: parseFloat(itemTax.toFixed(2)),
      priceBeforeTax: parseFloat(((inclusivePrice * quantity) - itemTax).toFixed(2))
    };
  }
  async orderlists(params: {
    page: number;
    limit: number;
    type?: string;
    userId: string;
    orderType: string;
    Id: string;
    status?: string;
    orderCode?: string;
    search?: string;
    createdById?: string;
    format?: string;
    date?: string
  }) {
    try {
      function calculatePacks(totalKg: number, packKg: number) {
        const fullPacks = Math.floor(totalKg / packKg);
        const looseKg = totalKg % packKg;
        return { fullPacks, looseKg };
      }
      const { page, limit, type, orderType, Id, status, orderCode, search, createdById, format, date } = params;

      if (page < 0) {
        throw new Error('Invalid pagination parameters');
      }
      const isAdminUser = await AdminUsers.findOne({ _id: params.createdById, isActive: true, isDelete: false });
      const queryConditions: any = {
        isDelete: false
      };
      if (type === "pos" && isAdminUser) {
        queryConditions.createdBy = new Types.ObjectId(createdById);
      }
      if (Id) {
        queryConditions.placedBy = new Types.ObjectId(Id);
      }

      if (type) {
        const types = type.toLowerCase();
        if (['customer', 'wholesaler', 'retailer'].includes(types)) {
          queryConditions.placedByModel =
            types === 'customer' ? 'User' :
              types === 'wholesaler' ? 'Wholesaler' : 'Retailer';
          queryConditions.orderFrom = { $ne: 'pos' };
        } else if (type === 'pos') {
          queryConditions.orderFrom = 'pos';
        }
      }
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        queryConditions.$or = [
          { orderCode: { $regex: searchRegex } },
          { paymentStatus: { $regex: searchRegex } },
          { status: { $regex: searchRegex } },
          { 'shippingAddress.contactName': { $regex: searchRegex } },
          { invoiceId: { $regex: searchRegex } },

        ];
      }
      if (date) {
        queryConditions.createdAt = {
          $gte: moment(date).startOf('day').toDate(),
          $lte: moment(date).endOf('day').toDate()
        };
      }


      if (orderType) queryConditions.orderType = orderType;
      if (status) queryConditions.status = status;
      if (orderCode) queryConditions.orderCode = orderCode;
      else if (!type) return Pagination(0, [], limit, page);
      let orders;
      let total;

      if (format === 'excel') {
        orders = await OrderModel.find(queryConditions)
          .sort({ createdAt: -1 })
          .lean();
        total = orders.length;
      } else {
        // Normal pagination flow
        total = await OrderModel.countDocuments(queryConditions);
        const skip = page * limit;

        if (skip >= total) {
          return Pagination(total, [], limit, page);
        }

        orders = await OrderModel.find(queryConditions)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean();
      }

      const finalResult = await Promise.all(
        orders.map(async (order: any) => {
          let userData;
          let overDue = false;
          let creditDueDate: any;
          let returnOrderDetails = null;
          let createdBy;

          try {
            if (status === 'return-initiated') {
              returnOrderDetails = await ReturnOrderModel.findOne({
                orderId: order._id,
                isDelete: false
              }).lean();

            }
            if (type) {
              if (type === 'customer' || type === 'pos') {
                userData = await Users.findOne({
                  _id: new Types.ObjectId(order.placedBy),
                  isDelete: false,
                  isActive: true,
                }).select('name').lean();
              } else if (type === 'wholesaler' || type === 'retailer') {
                userData = await WholesalerRetailsers.findOne({
                  _id: new Types.ObjectId(order.placedBy),
                  isDelete: false,
                  isActive: true,
                }).select('name').lean();

                const checkOverdue = await WholeSalerCreditModel.findOne({
                  wholeSalerId: order.placedBy,
                  isActive: true,
                  isDelete: false
                });

                if (checkOverdue?.creditPeriod) {
                  const dueDate = moment(order.createdAt).add(checkOverdue.creditPeriod, 'days');
                  overDue = moment().isAfter(dueDate, 'day');
                  creditDueDate = dueDate;
                }
              }
            }
            createdBy = await WholesalerRetailsers.findOne({
              _id: order.createdBy,
              isActive: true,
              isDelete: false
            });

            if (!createdBy) {
              createdBy = await Users.findOne({
                _id: order.createdBy,
                isActive: true,
                isDelete: false
              });
            }
            if (!createdBy) {
              createdBy = await AdminUsers.findOne({
                _id: order.createdBy,
                isActive: true,
                isDelete: false
              });
            }
            if (!createdBy) {
              createdBy = await Admin.findOne({
                _id: order.createdBy,
                isActive: true,
                isDelete: false
              });
            }
          } catch (error) {
            console.error(`Error fetching user data for order ${order._id}:`, error);
          }

          let calculatedTotalTax = 0;
          let calculatedSubTotalBeforeTax = 0;

          const items = await Promise.all(order.items.map(async (item: any) => {
            const prod = await ProductModel.findOne({ _id: item.productId, isActive: true, isDelete: false });
            const { itemTax, priceBeforeTax } = WholesaleOrderRepository.calculateTaxFromInclusivePrice(
              Number(item.unitPrice || 0),
              Number(item.quantity || 0),
              Number(item.discount || 0),
              Number(item.taxRate || 0)
            );
            calculatedTotalTax += itemTax;
            calculatedSubTotalBeforeTax += priceBeforeTax;

            const packs = calculatePacks(item.quantity ?? 0, prod?.quantityPerPack ?? 0);
            return {
              ...item,
              ...packs,
              productName: prod?.productName,
            }
          }));
          // console.log(items, "itemssssssssss");


          const totalTax = calculatedTotalTax;
          const subTotalBeforeTax = calculatedSubTotalBeforeTax;
          const discount = Number(order.discount != 0 ? order.discount : order.totalDiscount || order.totalDiscount || 0);
          // console.log(discount, "discount",);
          const deliveryCharge = Number(order.deliveryCharge || 0);
          const subtotalAfterDiscount = subTotalBeforeTax - Number(order.itemDiscount || 0);
          const roundoff = Number(order.roundoff || 0);
          const grandTotal = Number(subtotalAfterDiscount + totalTax + deliveryCharge + roundoff) - Number(order.totalDiscount || 0);
          return {
            ...order,
            name: userData?.name ?? '',
            createdByUserInfo: createdBy ?? "",
            breakdown: {
              subTotal: parseFloat(subTotalBeforeTax.toFixed(2)),
              discount: parseFloat(discount.toFixed(2)),
              roundoff: parseFloat(roundoff.toFixed(2)),
              subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
              tax: parseFloat(totalTax.toFixed(2)),
              shippingCharge: parseFloat(deliveryCharge.toFixed(2)),
              total: Math.round(grandTotal)
            },
            overDue,
            creditDueDate,
            items: items,
            returnOrder: returnOrderDetails ? {
              returnOrderCode: returnOrderDetails.orderCode,
              returnStatus: returnOrderDetails.status,
              returnPaymentStatus: returnOrderDetails.paymentStatus,
              returnReason: returnOrderDetails.reason
            } : null
          };
        })
      );
      // console.log(finalResult[0], "finalResultfinalResult");

      // Handle Excel format
      if (format === 'excel') {
        const excelFinalResult = finalResult.map((order: any, index) => {
          return {
            "S No": index + 1,
            "Invoice Id": order.invoiceId ? order.invoiceId : order.orderCode,
            "Customer Name": order?.shippingAddress?.contactName || "",
            "Order By": order.createdByUserInfo?.name || '',
            "Order Date": moment(order.createdAt).format('DD-MM-YYYY HH:mm'),
            "Total Amount": order.breakdown.total,
            "Payment Mode": order.paymentMode,
            "Order Status": order.status,
          };
        })

        return await Uploads.generateExcel(excelFinalResult)
      }
      return Pagination(total, finalResult, limit, page);
    } catch (e: any) {
      console.error('Error in orderlists:', e);
      return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }
  async updatePayment(params: {
    orderId: string;
    amountPaid: number;
    paymentMode: string;
    userId: string;
  }): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const { orderId, amountPaid, paymentMode, userId } = params;

      const order = await OrderModel.findOne({
        _id: new Types.ObjectId(orderId),
        isDelete: false
      });
      console.log(order, "rrrrrrrrrrrrrrrrrr");
      // return


      if (!order) {
        return createErrorResponse('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      if (order && String(order?.paymentMode) === "CREDIT") {
        // 2. Calculate new payment values
        const newAmountPaid = order.amountPaid + amountPaid;
        const newAmountPending = (order.totalAmount ?? 0) + Number(order.deliveryCharge ?? 0) - newAmountPaid;
        const newPaymentStatus = newAmountPending === 0 ? 'paid' :
          (newAmountPaid > 0 ? 'partially-paid' : 'unpaid');

        // 3. Create new credit management entry
        const newCreditEntry = {
          // creditId: order.placedby, // Using the wholesaler ID from order
          paidAmount: amountPaid,
          paidDateAndTime: new Date(),
          recivedUserId: userId, // The user who received the payment
          paymentType: paymentMode,
        };

        const updatedOrder = await OrderModel.updateOne(
          { _id: new Types.ObjectId(orderId) },
          {
            $set: {
              amountPaid: newAmountPaid,
              amountPending: newAmountPending,
              paymentStatus: newPaymentStatus,
              // paymentType: paymentMode,
              modifiedBy: userId,
            },
            $push: {
              creditManagement: newCreditEntry,
            },
          },
          { new: true } as any
        );

        if (!updatedOrder) {
          return createErrorResponse('Order not found after update', 404, 'ORDER_NOT_FOUND');
        }

        return successResponse('Payment updated successfully', StatusCodes.OK, { message: 'Payment updated successfully' });
      }
      else {
        const totalAmount = order.totalAmount || 0;
        const previousPaid = order.amountPaid || 0;
        const newAmountPaid = Math.max(Number(previousPaid) + Number(amountPaid), 0);
        const newAmountPending = Math.max(totalAmount - newAmountPaid, 0);

        let paymentStatus: 'pending' | 'partially-paid' | 'paid' = 'pending';
        if (newAmountPaid >= totalAmount) {
          paymentStatus = 'paid';
        } else if (newAmountPaid > 0) {
          paymentStatus = 'partially-paid';
        }

        const updatedOrder = await OrderModel.updateOne(
          { _id: new Types.ObjectId(orderId) },
          {
            $set: {
              amountPaid: newAmountPaid,
              amountPending: newAmountPending,
              paymentMode,
              paymentStatus,
              modifiedBy: new Types.ObjectId(userId),
            }
          }
        );

        if (!updatedOrder) {
          return createErrorResponse('Order not found after update', 404, 'ORDER_NOT_FOUND');
        }

        return successResponse('Payment updated successfully', StatusCodes.OK, { message: 'Payment updated successfully' });
      }

    } catch (err: any) {
      console.error('Error updating payment:', err);
      return createErrorResponse('Failed to update payment', 500, err.message);
    }
  }

  async orderDetails(orderId: string) {
    try {
      const order = await OrderModel.findOne({ _id: new Types.ObjectId(orderId), isDelete: false });

      if (!order) {
        return createErrorResponse('Order not found', StatusCodes.NOT_FOUND);
      }
      let placeByName;
      if (order && order?.placedByModel === "User") {
        placeByName = await Users.findOne({
          _id: order.placedBy,
          isActive: true,
          isDelete: false
        });
      }
      let user = await WholesalerRetailsers.findOne({
        _id: order.createdBy,
        isActive: true,
        isDelete: false
      });

      if (!user) {
        user = await Users.findOne({
          _id: order.createdBy,
          isActive: true,
          isDelete: false
        });
      }
      if (!user) {
        user = await AdminUsers.findOne({
          _id: order.createdBy,
          isActive: true,
          isDelete: false
        });
      }
      if (!user) {
        user = await Admin.findOne({
          _id: order.createdBy,
          isActive: true,
          isDelete: false
        });
      }

      const userName = user?.name ?? '';
      const placedByName = placeByName ? placeByName : "";
      let wholesalerTotalTax = 0;
      let customerTotalTax = 0;
      const products = await Promise.all(
        order.items.map(async (item: any) => {
          const product = await ProductModel.findOne({
            _id: new Types.ObjectId(item.productId),
            isActive: 1,
            isDelete: 0
          });

          if (!product) return null;

          const unitPrice = Number(item.unitPrice || 0);
          const quantity = Number(item.quantity || 0);
          const customerTaxRate = Number(product.customerTax || 0) / 100;
          const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

          const customerTaxPrice = customerTaxRate * unitPrice;
          const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;
          customerTotalTax += customerTaxPrice * quantity;

          wholesalerTotalTax += wholesalerTaxPrice * quantity;

          const [category] = await Promise.all([
            Category.findById(product.categoryId),
          ]);

          const attributeValueIds = Object.values(item.attributes || {}).filter(
            (val): val is string => typeof val === 'string'
          );

          const attributeObjectIds = attributeValueIds.map((id) => new Types.ObjectId(id));

          const attributeData = await Promise.all(
            attributeObjectIds.map((id) =>
              Attribute.findOne(
                { 'value._id': id },
                { name: 1, value: { $elemMatch: { _id: id } } }
              )
            )
          );

          const finalProduct: any = {
            ...product.toObject(),
            quantity,
            unitPrice,
            productCartId: item._id,
            attributeData,
            attributes: item.attributes,
            categoryName: category?.name ?? '',
            // productReview: !!review,
            productcustomerTotalTax: customerTaxPrice,
            productwholesalerTaxPrice: wholesalerTaxPrice
          };

          if (order.placedByModel === 'User' || 'AdminUser') {
            delete finalProduct.wholesalerAttribute;
          } else if (order.placedByModel === 'Wholesaler' || 'Retailer') {
            delete finalProduct.customerAttribute;
          }

          return finalProduct;
        })
      );

      const result = {
        ...order.toObject(),
        products: products.filter(Boolean),
        wholesalerTotalTax,
        customerTotalTax,
        placedByName,
        subTotal: order.totalAmount,
        // total: order.totalAmount + (order.placedByModel === 'User' || 'AdminUser' ? customerTotalTax : wholesalerTotalTax),
        total: (Number(order.totalAmount ?? 0) +
          Number(order.placedByModel === 'User' || 'AdminUser' ? customerTotalTax : wholesalerTotalTax) +
          Number(order?.deliveryCharge ?? 0)
        ).toFixed(2),
        userName,
        user
      };

      return successResponse('Successfully got order details', 200, result);
    } catch (e: any) {
      return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }
  async orderDetailsByInvoiceId(invoiceId: string) {
    try {
      const order = await OrderModel.findOne({
        invoiceId: invoiceId,
        orderFrom: "pos",
        status: { $nin: ["cancelled", "reorder"] },
        isDelete: false
      });

      console.log("Order found:", order?._id);

      if (!order) {
        return createErrorResponse('Order not found', StatusCodes.NOT_FOUND);
      }

      let placeByName;
      if (order && order?.placedByModel === "User") {
        placeByName = await Users.findOne({
          _id: order.placedBy,
          isActive: true,
          isDelete: false
        });
      }

      let user = await WholesalerRetailsers.findOne({
        _id: order.createdBy,
        isActive: true,
        isDelete: false
      });

      if (!user) {
        user = await Users.findOne({
          _id: order.createdBy,
          isActive: true,
          isDelete: false
        });
      }
      if (!user) {
        user = await AdminUsers.findOne({
          _id: order.createdBy,
          isActive: true,
          isDelete: false
        });
      }
      if (!user) {
        user = await Admin.findOne({
          _id: order.createdBy,
          isActive: true,
          isDelete: false
        });
      }

      const userName = user?.name ?? '';
      const placedByName = placeByName ? placeByName : "";
      let wholesalerTotalTax = 0;
      let customerTotalTax = 0;

      // Process each order item separately with individual lookups
      const products = await Promise.all(
        order.items.map(async (item: any) => {
          try {
            const productId = item.productId.toString();
            console.log("Processing product ID:", productId);

            // Get the product with basic details
            const product = await ProductModel.findOne({
              _id: new Types.ObjectId(productId),
              isActive: 1,
              isDelete: 0
            }).lean();

            if (!product) {
              console.log("Product not found:", productId);
              return null;
            }

            console.log("Product found:", product.productName);
            console.log("Customer attribute IDs:", product.customerAttribute?.attributeId);
            console.log("Customer rowData:", product.customerAttribute?.rowData);

            // Convert attribute IDs to ObjectIds
            const customerAttributeIds = product.customerAttribute?.attributeId?.map(id => new Types.ObjectId(id)) || [];
            const wholesalerAttributeIds = product.wholesalerAttribute?.attributeId?.map(id => new Types.ObjectId(id)) || [];

            // Get all related data using separate queries
            const [
              brandDtls,
              categoryIdDetails,
              subCategoryDetails,
              childCategoryDetails,
              wholesalerAttributeDetails,
              customerAttributeDetails,
              createdByUser,
              modifiedByUser
            ] = await Promise.all([
              Brand.findById(product.brand).select('name').lean(),
              Category.findById(product.categoryId).select('name').lean(),
              subcategory.findById(product.subCategory).select('name').lean(),
              childCategory.findById(product.childCategory).select('name').lean(),
              wholesalerAttributeIds.length > 0 ?
                Attribute.find({ _id: { $in: wholesalerAttributeIds } }).lean() :
                Promise.resolve([]),
              customerAttributeIds.length > 0 ?
                Attribute.find({ _id: { $in: customerAttributeIds } }).lean() :
                Promise.resolve([]),
              Admin.findById(product.createdBy).select('name').lean(),
              Admin.findById(product.modifiedBy).select('name').lean()
            ]);

            console.log("Customer attribute details found:", customerAttributeDetails?.length || 0);
            console.log("Wholesaler attribute details found:", wholesalerAttributeDetails?.length || 0);

            // Calculate taxes
            const unitPrice = Number(item.unitPrice || 0);
            const quantity = Number(item.quantity || 0);
            const customerTaxRate = Number(product.customerTax || 0) / 100;
            const wholesalerTaxRate = Number(product.wholesalerTax || 0) / 100;

            const customerTaxPrice = customerTaxRate * unitPrice;
            const wholesalerTaxPrice = wholesalerTaxRate * unitPrice;
            customerTotalTax += customerTaxPrice * quantity;
            wholesalerTotalTax += wholesalerTaxPrice * quantity;

            // Get attribute data for the selected variants
            const attributeValueIds = Object.values(item.attributes || {}).filter(
              (val): val is string => typeof val === 'string'
            );

            const attributeObjectIds = attributeValueIds.map((id) => new Types.ObjectId(id));

            // Get specific attribute data for the selected variants
            const attributeData = await Promise.all(
              attributeObjectIds.map((id) =>
                Attribute.findOne(
                  { 'value._id': id },
                  { name: 1, value: { $elemMatch: { _id: id } } }
                ).lean()
              )
            );

            // Filter customerAttributeDetails to only include variants that exist in rowData
            let filteredCustomerAttributeDetails: any[] = [];
            if (customerAttributeDetails && product.customerAttribute?.rowData) {
              const customerRowData = product.customerAttribute.rowData || [];

              filteredCustomerAttributeDetails = customerAttributeDetails.map((attr: any) => {
                // Filter variants to only include those that have data in rowData
                const filteredVariants = attr.value?.filter((variantObj: any) => {
                  // Check if this variant ID exists in any row of rowData
                  return customerRowData.some((row: any) => {
                    // Check all values in the row for this variant ID
                    return Object.values(row).some((val: any) =>
                      val === variantObj._id.toString()
                    );
                  });
                }) || [];

                return {
                  _id: attr._id,
                  name: attr.name,
                  value: filteredVariants,
                  isDelete: attr.isDelete,
                  isActive: attr.isActive,
                  createdBy: attr.createdBy,
                  modifiedBy: attr.modifiedBy,
                  createdAt: attr.createdAt,
                  updatedAt: attr.updatedAt,
                  __v: attr.__v
                };
              }).filter((attr: any) => attr.value && attr.value.length > 0);
            }

            // Filter wholesalerAttributeDetails similarly
            let filteredWholesalerAttributeDetails: any[] = [];
            if (wholesalerAttributeDetails && product.wholesalerAttribute?.rowData) {
              const wholesalerRowData = product.wholesalerAttribute.rowData || [];

              filteredWholesalerAttributeDetails = wholesalerAttributeDetails.map((attr: any) => {
                const filteredVariants = attr.value?.filter((variantObj: any) => {
                  return wholesalerRowData.some((row: any) => {
                    return Object.values(row).some((val: any) =>
                      val === variantObj._id.toString()
                    );
                  });
                }) || [];

                return {
                  _id: attr._id,
                  name: attr.name,
                  value: filteredVariants,
                  isDelete: attr.isDelete,
                  isActive: attr.isActive,
                  createdBy: attr.createdBy,
                  modifiedBy: attr.modifiedBy,
                  createdAt: attr.createdAt,
                  updatedAt: attr.updatedAt,
                  __v: attr.__v
                };
              }).filter((attr: any) => attr.value && attr.value.length > 0);
            }

            console.log("Filtered customer attribute details:", filteredCustomerAttributeDetails.length);

            // Build the final product object
            const finalProduct: any = {
              ...product,
              brandName: brandDtls?.name || '',
              categoryName: categoryIdDetails?.name || '',
              subCategoryName: subCategoryDetails?.name || '',
              childCategoryName: childCategoryDetails?.name || '',
              createdBy: createdByUser?.name || '',
              modifiedBy: modifiedByUser?.name || '',
              quantity,
              unitPrice,
              productCartId: item._id,
              attributeData,
              attributes: item.attributes,
              // Include the filtered attribute details
              customerAttributeDetails: filteredCustomerAttributeDetails,
              wholesalerAttributeDetails: filteredWholesalerAttributeDetails,
              productcustomerTotalTax: customerTaxPrice,
              productwholesalerTaxPrice: wholesalerTaxPrice
            };

            // Remove unnecessary attributes based on order type
            if (order.placedByModel === 'User' || order.placedByModel === 'AdminUser') {
              delete finalProduct.wholesalerAttribute;
              delete finalProduct.wholesalerAttributeDetails;
            } else if (order.placedByModel === 'Wholesaler' || order.placedByModel === 'Retailer') {
              delete finalProduct.customerAttribute;
              delete finalProduct.customerAttributeDetails;
            }

            console.log("Product processed successfully:", finalProduct.productName);
            console.log("Has customerAttributeDetails:", !!finalProduct.customerAttributeDetails);
            console.log("customerAttributeDetails length:", finalProduct.customerAttributeDetails?.length || 0);

            return finalProduct;

          } catch (error) {
            console.error("Error processing product item:", error);
            return null;
          }
        })
      );

      const filteredProducts = products.filter(Boolean);
      console.log("Total products processed:", filteredProducts.length);

      if (filteredProducts.length > 0) {
        console.log("First product details:", {
          name: filteredProducts[0].productName,
          hasCustomerAttrDetails: !!filteredProducts[0].customerAttributeDetails,
          customerAttrDetailsLength: filteredProducts[0].customerAttributeDetails?.length || 0,
          customerAttrDetails: filteredProducts[0].customerAttributeDetails
        });
      }

      const result = {
        ...order.toObject(),
        products: filteredProducts,
        wholesalerTotalTax,
        customerTotalTax,
        placedByName,
        subTotal: order.totalAmount,
        total: (Number(order.totalAmount ?? 0) +
          Number(order.placedByModel === 'User' || order.placedByModel === 'AdminUser' ? customerTotalTax : wholesalerTotalTax) +
          Number(order?.deliveryCharge ?? 0)
        ).toFixed(2),
        userName,
        user
      };

      return successResponse('Successfully got order details', 200, result);
    } catch (e: any) {
      console.error("Error in orderDetailsByInvoiceId:", e);
      return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }
  async returnOrderList(params: { page: number; limit: number; type?: string; userId: string }) {
    try {

      const { page, limit, type = '', userId } = params;
      const pipeline: any[] = [];

      const placedByModel = type === 'customer' ? 'User' : 'Wholesaler';

      pipeline.push({
        $match: {
          isDelete: false,
          placedByModel
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
        placedByModel
      });

      const finalResult = await Promise.all(
        data.map(async (cartItem) => {
          let customerTotalTax = 0;
          let wholesalerTotalTax = 0;
          let userName = '';

          // Fetch user name based on type
          if (type === 'customer' || type === 'pos') {
            const user = await Users.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
            userName = user?.name ?? '';
          } else if (type === 'wholesaler' || type === 'pos') {
            const user = await WholesalerRetailsers.findOne({ _id: cartItem.placedBy, isActive: true, isDelete: false });
            userName = user?.name ?? '';
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
                productwholesalerTaxPrice: wholesalerTaxPrice
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
            total: cartItem.totalAmount + (type === 'customer' ? customerTotalTax : wholesalerTotalTax) + (cartItem?.deliveryCharge ?? 0),
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
  async updateReturnOrderStatus(id: string, status: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
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
  async topWholesalerOrder(params: {
    page: number;
    limit: number;
    type?: string;
    userId: string;
    orderType: string;
    Id: string;
    status?: string;
    orderCode?: string;
    placedByModel: string;
  }) {
    try {
      const { page, limit, type, orderType, Id, status, orderCode, placedByModel } = params;
      console.log(params, "params-orderlists");

      if (page < 0) {
        throw new Error('Invalid pagination parameters');
      }
      const count = await OrderModel.countDocuments([
        {
          $match: {
            isDelete: false,
            placedByModel: placedByModel,
          }
        }])
      const results = await OrderModel.aggregate([
        // Stage 1: Filter orders (non-deleted, wholesaler-placed)
        {
          $match: {
            isDelete: false,
            placedByModel: placedByModel,
          }
        },

        // Stage 2: Join with wholesaler data
        {
          $lookup: {
            from: 'wholesalerretailers',
            localField: 'placedBy',
            foreignField: '_id',
            as: 'wholesalerInfo'
          }
        },
        { $unwind: '$wholesalerInfo' }, // Flatten the array (assuming 1:1 relationship)

        // Stage 3: Group by wholesaler & compute sums
        {
          $group: {
            _id: '$placedBy', // Group by wholesaler ID
            orderCount: { $sum: 1 }, // Count orders per wholesaler
            totalAmountSum: { $sum: '$totalAmount' }, // Sum of all order amounts
            paidAmountSum: { $sum: '$amountPaid' }, // Sum of payments received
            wholesalerName: { $first: '$wholesalerInfo.name' }, // Get wholesaler name
            wholesalerData: { $first: '$wholesalerInfo' }, // Preserve all wholesaler fields
            orderId: { $first: '$orderCode' },
            orderDate: { $first: '$createdAt' },
            paymentMode: { $first: '$paymentMode' },
            orderStatus: { $first: '$status' }
          }
        },

        // Stage 4: Compute balance (total - paid)
        {
          $addFields: {
            balance: { $subtract: ['$totalAmountSum', '$paidAmountSum'] }
          }
        },

        // Stage 5: Sort by highest total amount (or orderCount, if preferred)
        { $sort: { totalAmountSum: -1 } },

        // Stage 6: Apply pagination
        { $skip: page * limit },
        { $limit: limit },

        // Stage 7: Project final fields (customize as needed)
        {
          $project: {
            wholesalerId: '$_id',
            wholesalerName: 1,
            orderCount: 1,
            totalAmountSum: 1,
            paidAmountSum: 1,
            balance: 1,
            // Include other wholesaler fields if needed:
            phone: '$wholesalerData.phone',
            email: '$wholesalerData.email',
            orderId: 1,
            orderDate: 1,
            paymentMode: 1,
            orderStatus: 1
            // ...add more fields
          }
        }
      ]);
      return Pagination(count, results, limit, page);

    } catch (e: any) {
      console.error('Error in orderlists:', e);
      return createErrorResponse('List error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }
}

export function newWholesaleOrderRepository(): IWholesaleOrderRepository {
  return new WholesaleOrderRepository();
}
