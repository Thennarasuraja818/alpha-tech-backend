import { StatusCodes } from "http-status-codes";
// import moment from "moment";
import { PettyCashModel, IPettyCash } from "../../../app/model/pettyCash";
import {
  IPettyCashRepository,
  PettyCashParams,
} from "../../../domain/admin/pettyCashDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { successResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
// import { Uploads } from "../../../utils/uploads/image.upload";
import { CreatePettyCashInput, UpdatePettyCashInput } from "../../../api/Request/pettyCash";
import { OrderModel } from "../../../app/model/order";
import moment from "moment";
import { PaymentReceiveModel } from "../../../app/model/paymentReceive";
import AdminUsers from "../../../app/model/admin.user";
import Admin from "../../../app/model/admin";
import mongoose from "mongoose";
import { PettyCashManagementModel } from "../../../app/model/pettyCash.management";
// import { UploadedFile } from "express-fileupload";

export class PettyCashRepository implements IPettyCashRepository {
  constructor() { }
  // infrastructure/admin/pettyCash.repository.ts

  private async calculateOpeningBalance(date: Date, userId: string, employeeId?: string[]): Promise<number> {
    const startOfDay = moment(date).clone().startOf("day").toDate();
    const endOfDay = moment(date).clone().endOf("day").toDate();

    console.log("Calculating opening balance for:", {
      date,
      userId,
      startOfDay,
      endOfDay
    });

    // Get initial amount from petty cash management for the specific employee
    const balance = await PettyCashManagementModel.findOne(
      {
        date: { $gte: startOfDay, $lte: endOfDay },
        isDelete: false,
        receiver: new Types.ObjectId(userId)
      },
      { initialAmount: 1 }
    );

    // If no petty cash management record found, check if we have any cash transactions
    if (!balance) {
      console.log("No petty cash management record found for this date");

      // Check if we have any cash collections (orders or payment receipts)
      const [directCashSales, cashPayments] = await Promise.all([
        // Calculate total CASH sales from OrderModel (POS orders)
        OrderModel.aggregate([
          {
            $match: {
              orderFrom: "pos",
              createdAt: { $gte: startOfDay, $lte: endOfDay },
              isDelete: false,
              createdBy: new Types.ObjectId(userId),
            }
          },
          {
            $group: {
              _id: null,
              totalCashSales: { $sum: "$totalAmount" }
            }
          }
        ]),

        // Calculate CASH payments from PaymentReceiveModel
        PaymentReceiveModel.aggregate([
          {
            $match: {
              paymentDate: { $gte: startOfDay, $lte: endOfDay },
              paymentMethod: "Cash",
              isDelete: false,
              createdBy: new Types.ObjectId(userId),
            }
          },
          {
            $group: {
              _id: null,
              totalCashPayments: { $sum: "$paidAmount" }
            }
          }
        ])
      ]);

      const directCashTotal = directCashSales.length > 0 ? directCashSales[0].totalCashSales : 0;
      const cashPaymentsTotal = cashPayments.length > 0 ? cashPayments[0].totalCashPayments : 0;

      const totalCashCollection = directCashTotal + cashPaymentsTotal;

      console.log("Cash without petty cash management:", {
        directCashSales: directCashTotal,
        cashPayments: cashPaymentsTotal,
        totalCashCollection
      });

      // If we have cash collections, allow expenses up to that amount
      if (totalCashCollection > 0) {
        console.log("Allowing expenses from cash collections:", totalCashCollection);
        return totalCashCollection;
      }

      // If no cash collections either, return 0
      return 0;
    }

    console.log("Initial Amount from PettyCashManagement:", balance.initialAmount);

    // Calculate total CASH collections (both from orders and payment receipts)
    const [directCashSales, cashPayments] = await Promise.all([
      // Calculate total CASH sales from OrderModel (POS orders)
      OrderModel.aggregate([
        {
          $match: {
            orderFrom: "pos",
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            isDelete: false,
            createdBy: new Types.ObjectId(userId),
          }
        },
        {
          $group: {
            _id: null,
            totalCashSales: { $sum: "$totalAmount" }
          }
        }
      ]),

      // Calculate CASH payments from PaymentReceiveModel
      PaymentReceiveModel.aggregate([
        {
          $match: {
            paymentDate: { $gte: startOfDay, $lte: endOfDay },
            paymentMethod: "Cash",
            isDelete: false,
            createdBy: new Types.ObjectId(userId),
          }
        },
        {
          $group: {
            _id: null,
            totalCashPayments: { $sum: "$paidAmount" }
          }
        }
      ])
    ]);

    const directCashTotal = directCashSales.length > 0 ? directCashSales[0].totalCashSales : 0;
    const cashPaymentsTotal = cashPayments.length > 0 ? cashPayments[0].totalCashPayments : 0;

    const totalCashCollection = directCashTotal + cashPaymentsTotal;
    console.log("Cash Collections:", {
      directCashSales: directCashTotal,
      cashPayments: cashPaymentsTotal,
      totalCashCollection
    });

    // Calculate total expenses from PettyCashModel for the day
    const expenses = await PettyCashModel.aggregate([
      {
        $match: {
          isDelete: false,
          isActive: true,
          createdBy: new Types.ObjectId(userId),
          date: { $gte: startOfDay, $lte: endOfDay },
          transactionType: { $in: ['expense', 'purchase', 'withdrawal'] }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" }
        }
      }
    ]);

    const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;
    console.log("Total Expenses from PettyCash:", totalExpenses);

    // Calculate available balance
    const availableBalance = balance.initialAmount + totalCashCollection - totalExpenses;
    console.log("Available Balance Calculation:", {
      initialAmount: balance.initialAmount,
      cashCollection: totalCashCollection,
      expenses: totalExpenses,
      availableBalance
    });

    return availableBalance;
  }

  // async createTransaction(data: CreatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse> {
  //   const session = await mongoose.startSession();

  //   try {
  //     session.startTransaction();

  //     console.log(data, "Input Data");
  //     console.log(userId, "User ID");

  //     // For expense transactions, check opening balance
  //     if (['expense', 'purchase'].includes(data.transactionType)) {
  //       const openingBalance = await this.calculateOpeningBalance(
  //         new Date(data.date),
  //         userId,
  //         data.employeeId ? [data.employeeId] : undefined
  //       );

  //       console.log("Opening Balance:", openingBalance);

  //       // Check if sufficient balance for expense transactions
  //       if (openingBalance < data.amount) {
  //         await session.abortTransaction();
  //         return createErrorResponse(
  //           `Insufficient balance. Available: ${openingBalance}, Required: ${data.amount}`,
  //           StatusCodes.BAD_REQUEST,
  //           "INSUFFICIENT_BALANCE"
  //         );
  //       }
  //     }

  //     // Create the transaction in PettyCashModel
  //     const transactionData: any = {
  //       date: new Date(data.date),
  //       amount: data.amount,
  //       receiver: data.receiver || '',
  //       employeeId: data.employeeId ? new mongoose.Types.ObjectId(data.employeeId) : undefined,
  //       description: data.description,
  //       paymentMode: data.paymentMode,
  //       transactionType: data.transactionType,
  //       createdBy: new mongoose.Types.ObjectId(userId),
  //       modifiedBy: new mongoose.Types.ObjectId(userId),
  //       isActive: true,
  //       isDelete: false,
  //     };

  //     const transaction = new PettyCashModel(transactionData);
  //     await transaction.save({ session });

  //     // Populate employee details for response if employeeId exists
  //     if (data.employeeId) {
  //       await transaction.populate({
  //         path: 'employeeId',
  //         select: 'name fullName'
  //       });
  //     }

  //     await session.commitTransaction();

  //     return successResponse('Transaction created successfully', StatusCodes.CREATED, transaction);
  //   } catch (error: any) {
  //     await session.abortTransaction();
  //     console.error("Error creating transaction:", error);
  //     return createErrorResponse(
  //       "Failed to create transaction",
  //       StatusCodes.INTERNAL_SERVER_ERROR,
  //       error.message
  //     );
  //   } finally {
  //     await session.endSession();
  //   }
  // }

  async createTransaction(data: CreatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      console.log(data, "Input Data");
      console.log(userId, "User ID");

      // For expense transactions, check opening balance
      if (['expense', 'purchase', 'withdrawal'].includes(data.transactionType)) {
        const openingBalance = await this.calculateOpeningBalance(
          new Date(data.date),
          userId,
          data.employeeId ? [data.employeeId] : undefined
        );

        console.log("Opening Balance for expense check:", openingBalance);

        // Check if sufficient balance for expense transactions
        if (openingBalance < data.amount) {
          await session.abortTransaction();

          // Get detailed breakdown for better error message
          const startOfDay = moment(data.date).clone().startOf("day").toDate();
          const endOfDay = moment(data.date).clone().endOf("day").toDate();

          const [cashSales, cashPayments, existingExpenses] = await Promise.all([
            OrderModel.aggregate([
              {
                $match: {
                  orderFrom: "pos",
                  createdAt: { $gte: startOfDay, $lte: endOfDay },
                  isDelete: false,
                  createdBy: new Types.ObjectId(userId),
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$totalAmount" }
                }
              }
            ]),
            PaymentReceiveModel.aggregate([
              {
                $match: {
                  paymentDate: { $gte: startOfDay, $lte: endOfDay },
                  paymentMethod: "Cash",
                  isDelete: false,
                  createdBy: new Types.ObjectId(userId),
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$paidAmount" }
                }
              }
            ]),
            PettyCashModel.aggregate([
              {
                $match: {
                  isDelete: false,
                  createdBy: new Types.ObjectId(userId),
                  date: { $gte: startOfDay, $lte: endOfDay },
                  transactionType: { $in: ['expense', 'purchase', 'withdrawal'] }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" }
                }
              }
            ])
          ]);

          const cashSalesTotal = cashSales.length > 0 ? cashSales[0].total : 0;
          const cashPaymentsTotal = cashPayments.length > 0 ? cashPayments[0].total : 0;
          const existingExpensesTotal = existingExpenses.length > 0 ? existingExpenses[0].total : 0;

          return createErrorResponse(
            `Insufficient balance. Available: ${openingBalance}, Required: ${data.amount}. ` +
            `Cash Breakdown - Sales: ${cashSalesTotal}, Payments: ${cashPaymentsTotal}, Existing Expenses: ${existingExpensesTotal}`,
            StatusCodes.BAD_REQUEST,
            "INSUFFICIENT_BALANCE"
          );
        }
      }

      // Create the transaction in PettyCashModel
      const transactionData: any = {
        date: new Date(data.date),
        amount: data.amount,
        receiver: data.receiver || '',
        employeeId: data.employeeId ? new mongoose.Types.ObjectId(data.employeeId) : undefined,
        description: data.description,
        paymentMode: data.paymentMode,
        transactionType: data.transactionType,
        createdBy: new mongoose.Types.ObjectId(userId),
        modifiedBy: new mongoose.Types.ObjectId(userId),
        isActive: true,
        isDelete: false,
      };

      const transaction = new PettyCashModel(transactionData);
      await transaction.save({ session });

      // Populate employee details for response if employeeId exists
      if (data.employeeId) {
        await transaction.populate({
          path: 'employeeId',
          select: 'name fullName'
        });
      }

      await session.commitTransaction();

      return successResponse('Transaction created successfully', StatusCodes.CREATED, transaction);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error creating transaction:", error);
      return createErrorResponse(
        "Failed to create transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    } finally {
      await session.endSession();
    }
  }

  async getTransactionById(id: string): Promise<ApiResponse<IPettyCash> | ErrorResponse> {
    try {
      const transaction = await PettyCashModel.findOne({ _id: id, isDelete: false });
      if (!transaction) {
        return createErrorResponse(
          "Transaction not found",
          StatusCodes.NOT_FOUND
        );
      }
      return successResponse('Transaction retrieved successfully', StatusCodes.OK, transaction);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // async getAllTransactions(params: PettyCashParams, userId: string): Promise<PaginationResult<IPettyCash> | ErrorResponse> {
  //   try {
  //     const { page = 1, limit = 10, search, startDate, transactionType, paymentMode } = params;
  //     const skip = (page - 1) * limit;

  //     const query: any = { isDelete: false };

  //     if (search) {
  //       query.$or = [
  //         { receiver: { $regex: search, $options: 'i' } },
  //         { description: { $regex: search, $options: 'i' } },
  //         { referenceNumber: { $regex: search, $options: 'i' } },
  //       ];
  //     }

  //     if (startDate) {
  //       query.date = {
  //         $gte: new Date(startDate),
  //         $lte: new Date(new Date(startDate).setHours(23, 59, 59, 999)), // End of the same day
  //       };
  //     }

  //     if (transactionType) {
  //       query.transactionType = transactionType;
  //     }

  //     if (paymentMode) {
  //       query.paymentMode = paymentMode;
  //     }

  //     const userObjectId = new ObjectId(userId);

  //     // Check user type in parallel
  //     const [adminUser, superAdmin] = await Promise.all([
  //       AdminUsers.findOne({ _id: userObjectId, isDelete: false }),
  //       Admin.findOne({ _id: userObjectId, isDelete: false })
  //     ]);
  //     console.log(adminUser, "aaaaaaaaaaa");
  //     console.log(superAdmin, "sssssssssss");

  //     // If user is AdminUser (employee/biller) but NOT super admin, filter by createdBy
  //     if (adminUser && !superAdmin) {
  //       query.createdBy = userObjectId;
  //     }

  //     // Get petty cash management data for the same date
  //     let pettyCashManagementData = null;
  //     if (startDate) {
  //       // Base match condition for date
  //       const pettyCashMatch: any = {
  //         date: {
  //           $gte: new Date(startDate),
  //           $lte: new Date(new Date(startDate).setHours(23, 59, 59, 999)),
  //         },
  //         isDelete: false
  //       };

  //       // For AdminUser (non-super admin), filter by receiver
  //       // For SuperAdmin, get all data for that date
  //       if (adminUser && !superAdmin) {
  //         pettyCashMatch.receiver = userObjectId;
  //       }
  //       // If superAdmin, no additional filtering - get all records for the date

  //       pettyCashManagementData = await PettyCashManagementModel.aggregate([
  //         {
  //           $match: pettyCashMatch
  //         },
  //         {
  //           $lookup: {
  //             from: 'adminusers',
  //             localField: 'giver',
  //             foreignField: '_id',
  //             as: 'giverInfo'
  //           }
  //         },
  //         {
  //           $lookup: {
  //             from: 'adminusers',
  //             localField: 'receiver',
  //             foreignField: '_id',
  //             as: 'receiverInfo'
  //           }
  //         },
  //         {
  //           $lookup: {
  //             from: 'adminusers',
  //             localField: 'handover',
  //             foreignField: '_id',
  //             as: 'handoverInfo'
  //           }
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             initialAmount: 1,
  //             salesAmount: 1,
  //             expensesAmount: 1,
  //             closingAmount: 1,
  //             differenceAmount: 1,
  //             differenceType: 1,
  //             adminApproved: 1,
  //             denominations: 1,
  //             giver: { $arrayElemAt: ['$giverInfo.name', 0] },
  //             receiver: { $arrayElemAt: ['$receiverInfo.name', 0] },
  //             handover: { $arrayElemAt: ['$handoverInfo.name', 0] },
  //             createdBy: 1,
  //             createdAt: 1,
  //             updatedAt: 1
  //           }
  //         }
  //       ]);

  //       // For SuperAdmin, calculate total sums across all petty cash management records
  //       if (superAdmin && pettyCashManagementData.length > 0) {
  //         const totalSums = await PettyCashManagementModel.aggregate([
  //           {
  //             $match: pettyCashMatch
  //           },
  //           {
  //             $group: {
  //               _id: null,
  //               totalInitialAmount: { $sum: '$initialAmount' },
  //               totalSalesAmount: { $sum: '$salesAmount' },
  //               totalExpensesAmount: { $sum: '$expensesAmount' },
  //               totalClosingAmount: { $sum: '$closingAmount' },
  //               totalDifferenceAmount: { $sum: '$differenceAmount' },
  //               recordCount: { $sum: 1 }
  //             }
  //           }
  //         ]);

  //         // If we have total sums, create a summary object
  //         if (totalSums.length > 0) {
  //           const summary = totalSums[0];
  //           pettyCashManagementData = [{
  //             _id: 'summary',
  //             date: startDate,
  //             initialAmount: summary.totalInitialAmount,
  //             salesAmount: summary.totalSalesAmount,
  //             expensesAmount: summary.totalExpensesAmount,
  //             closingAmount: summary.totalClosingAmount,
  //             differenceAmount: summary.totalDifferenceAmount,
  //             differenceType: 'summary', // Special type for summary
  //             adminApproved: false,
  //             denominations: [],
  //             giver: 'Multiple Users',
  //             receiver: 'Multiple Users',
  //             handover: 'Multiple Users',
  //             createdBy: userObjectId,
  //             createdAt: new Date(),
  //             updatedAt: new Date(),
  //             isSummary: true, // Flag to indicate this is a summary
  //             recordCount: summary.recordCount
  //           }];
  //         }
  //       }
  //     }

  //     // Get petty cash transactions with aggregation
  //     const aggregationPipeline: any[] = [
  //       { $match: query },
  //       {
  //         $lookup: {
  //           from: 'adminusers',
  //           localField: 'employeeId',
  //           foreignField: '_id',
  //           as: 'employeeInfo'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'admins',
  //           localField: 'createdBy',
  //           foreignField: '_id',
  //           as: 'createdByInfo'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'admins',
  //           localField: 'modifiedBy',
  //           foreignField: '_id',
  //           as: 'modifiedByInfo'
  //         }
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           date: 1,
  //           amount: 1,
  //           receiver: 1,
  //           description: 1,
  //           paymentMode: 1,
  //           transactionType: 1,
  //           isDelete: 1,
  //           isActive: 1,
  //           createdAt: 1,
  //           updatedAt: 1,
  //           employeeId: {
  //             $cond: {
  //               if: { $gt: [{ $size: '$employeeInfo' }, 0] },
  //               then: { $arrayElemAt: ['$employeeInfo', 0] },
  //               else: null
  //             }
  //           },
  //           createdBy: {
  //             $cond: {
  //               if: { $gt: [{ $size: '$createdByInfo' }, 0] },
  //               then: { $arrayElemAt: ['$createdByInfo', 0] },
  //               else: null
  //             }
  //           },
  //           modifiedBy: {
  //             $cond: {
  //               if: { $gt: [{ $size: '$modifiedByInfo' }, 0] },
  //               then: { $arrayElemAt: ['$modifiedByInfo', 0] },
  //               else: null
  //             }
  //           }
  //         }
  //       },
  //       { $sort: { date: -1 } },
  //       { $skip: skip },
  //       { $limit: limit }
  //     ];

  //     const [items, total, pettyCashManagement] = await Promise.all([
  //       PettyCashModel.aggregate(aggregationPipeline),
  //       PettyCashModel.countDocuments(query),
  //       Promise.resolve(pettyCashManagementData)
  //     ]);

  //     return {
  //       status: StatusCodes.OK,
  //       message: 'Transactions retrieved successfully',
  //       data: items,
  //       overallTotals: pettyCashManagement && pettyCashManagement.length > 0 ? pettyCashManagement[0] : null,
  //       totalCount: total,
  //       currentPage: page,
  //       totalPages: Math.ceil(total / limit),
  //       from: (page - 1) * limit + 1,
  //       to: Math.min(page * limit, total),
  //       // userType: superAdmin ? 'superadmin' : (adminUser ? 'adminuser' : 'unknown')
  //     };
  //   } catch (error: any) {
  //     return createErrorResponse(
  //       "Failed to fetch transactions",
  //       StatusCodes.INTERNAL_SERVER_ERROR,
  //       error.message
  //     );
  //   }
  // }

  async getAllTransactions(params: PettyCashParams, userId: string): Promise<any | ErrorResponse> {
    try {
      const { page, limit, search, startDate, transactionType, paymentMode } = params;

      const skip = page * limit;

      const query: any = { isDelete: false };

      if (search) {
        query.$or = [
          { receiver: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (startDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(startDate).setHours(23, 59, 59, 999)), // End of the same day
        };
      }

      if (transactionType) {
        query.transactionType = transactionType;
      }

      if (paymentMode) {
        query.paymentMode = paymentMode;
      }

      const userObjectId = new Types.ObjectId(userId);

      // Check user type in parallel
      const [adminUser, superAdmin] = await Promise.all([
        AdminUsers.findOne({ _id: userObjectId, isDelete: false }),
        Admin.findOne({ _id: userObjectId, isDelete: false })
      ]);
      console.log(adminUser, "aaaaaaaaaaa");
      console.log(superAdmin, "sssssssssss");

      // If user is AdminUser (employee/biller) but NOT super admin, filter by createdBy
      if (adminUser && !superAdmin) {
        query.createdBy = userObjectId;
      }

      // Get petty cash management data for the same date
      let pettyCashManagementData = null;
      if (startDate) {
        // Base match condition for date
        const pettyCashMatch: any = {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(startDate).setHours(23, 59, 59, 999)),
          },
          isDelete: false
        };

        // For AdminUser (non-super admin), filter by receiver
        // For SuperAdmin, get all data for that date
        if (adminUser && !superAdmin) {
          pettyCashMatch.receiver = userObjectId;
        }
        // If superAdmin, no additional filtering - get all records for the date

        pettyCashManagementData = await PettyCashManagementModel.aggregate([
          {
            $match: pettyCashMatch
          },
          {
            $lookup: {
              from: 'adminusers',
              localField: 'giver',
              foreignField: '_id',
              as: 'giverInfo'
            }
          },
          {
            $lookup: {
              from: 'adminusers',
              localField: 'receiver',
              foreignField: '_id',
              as: 'receiverInfo'
            }
          },
          {
            $lookup: {
              from: 'adminusers',
              localField: 'handover',
              foreignField: '_id',
              as: 'handoverInfo'
            }
          },
          {
            $project: {
              _id: 1,
              date: 1,
              initialAmount: 1,
              salesAmount: 1,
              expensesAmount: 1,
              closingAmount: 1,
              differenceAmount: 1,
              differenceType: 1,
              adminApproved: 1,
              denominations: 1,
              giver: { $arrayElemAt: ['$giverInfo.name', 0] },
              receiver: { $arrayElemAt: ['$receiverInfo.name', 0] },
              handover: { $arrayElemAt: ['$handoverInfo.name', 0] },
              receiverId: { $arrayElemAt: ['$receiverInfo._id', 0] },
              createdBy: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        ]);

        // Process petty cash management data to calculate salesAmount and expensesAmount for records with closingAmount: 0
        if (pettyCashManagementData.length > 0) {
          pettyCashManagementData = await Promise.all(
            pettyCashManagementData.map(async (item) => {
              // If closingAmount is 0, calculate salesAmount and expensesAmount from related models
              if (item.closingAmount === 0 || item.closingAmount === null) {
                const shiftStartDate = new Date(item.date);
                const shiftEndDate = new Date(item.date);
                shiftEndDate.setHours(23, 59, 59, 999);

                const receiverId = item.receiverId || userObjectId;

                try {
                  // ✅ 1. Get POS orders for the shift to find order IDs
                  const posOrders = await OrderModel.find({
                    orderFrom: "pos",
                    createdAt: {
                      $gte: shiftStartDate,
                      $lte: shiftEndDate,
                    },
                    isDelete: false,
                    // Only include orders created by the receiver
                    ...(receiverId && { createdBy: receiverId })
                  }).select('_id orderCode totalAmount paymentStatus');

                  const orderIds = posOrders.map(order => order._id);

                  // ✅ 2. Get CASH payments from PaymentReceiveModel for these POS orders
                  const cashPaymentsAgg = await PaymentReceiveModel.aggregate([
                    {
                      $match: {
                        orderId: { $in: orderIds },
                        paymentMethod: "Cash",
                        paymentDate: {
                          $gte: shiftStartDate,
                          $lte: shiftEndDate,
                        },
                        isDelete: false,
                        createdBy: receiverId
                      }
                    },
                    {
                      $group: {
                        _id: null,
                        totalCashPayments: { $sum: "$paidAmount" },
                        paymentCount: { $sum: 1 }
                      }
                    }
                  ]);

                  const totalCashPayments = cashPaymentsAgg.length > 0 ? parseFloat(cashPaymentsAgg[0].totalCashPayments.toFixed(2)) : 0;

                  // ✅ 3. Calculate total expenses from PettyCashModel for this shift
                  const pettyCashExpensesAgg = await PettyCashModel.aggregate([
                    {
                      $match: {
                        createdBy: receiverId,
                        date: {
                          $gte: shiftStartDate,
                          $lte: shiftEndDate,
                        },
                        transactionType: { $in: ['expense', 'purchase', 'withdrawal'] },
                        isDelete: false
                      }
                    },
                    {
                      $group: {
                        _id: null,
                        totalExpenses: { $sum: "$amount" },
                        expenseCount: { $sum: 1 }
                      }
                    }
                  ]);

                  const totalExpenses = pettyCashExpensesAgg.length > 0 ? parseFloat(pettyCashExpensesAgg[0].totalExpenses.toFixed(2)) : 0;

                  // Update the item with calculated values
                  return {
                    ...item,
                    salesAmount: totalCashPayments,
                    expensesAmount: totalExpenses,
                    calculated: true // Flag to indicate calculated values
                  };
                } catch (error) {
                  console.error(`Error calculating amounts for shift ${item._id}:`, error);
                  // Return original item if calculation fails
                  return item;
                }
              } else {
                // For records with non-zero closingAmount, return as is
                return item;
              }
            })
          );
        }

        // For SuperAdmin, calculate total sums across all petty cash management records
        if (superAdmin && pettyCashManagementData.length > 0) {
          const totalSums = await PettyCashManagementModel.aggregate([
            {
              $match: pettyCashMatch
            },
            {
              $group: {
                _id: null,
                totalInitialAmount: { $sum: '$initialAmount' },
                totalSalesAmount: { $sum: '$salesAmount' },
                totalExpensesAmount: { $sum: '$expensesAmount' },
                totalClosingAmount: { $sum: '$closingAmount' },
                totalDifferenceAmount: { $sum: '$differenceAmount' },
                recordCount: { $sum: 1 }
              }
            }
          ]);

          // If we have total sums, create a summary object
          if (totalSums.length > 0) {
            const summary = totalSums[0];

            // Calculate total calculated sales and expenses from processed data
            const totalCalculatedSales = pettyCashManagementData.reduce((sum, item) =>
              sum + (item.salesAmount || 0), 0);
            const totalCalculatedExpenses = pettyCashManagementData.reduce((sum, item) =>
              sum + (item.expensesAmount || 0), 0);

            pettyCashManagementData = [{
              _id: 'summary',
              date: startDate,
              initialAmount: summary.totalInitialAmount,
              salesAmount: totalCalculatedSales > 0 ? totalCalculatedSales : summary.totalSalesAmount,
              expensesAmount: totalCalculatedExpenses > 0 ? totalCalculatedExpenses : summary.totalExpensesAmount,
              closingAmount: summary.totalClosingAmount,
              differenceAmount: summary.totalDifferenceAmount,
              differenceType: 'summary', // Special type for summary
              adminApproved: false,
              denominations: [],
              giver: 'Multiple Users',
              receiver: 'Multiple Users',
              handover: 'Multiple Users',
              createdBy: userObjectId,
              createdAt: new Date(),
              updatedAt: new Date(),
              isSummary: true, // Flag to indicate this is a summary
              recordCount: summary.recordCount,
              calculated: totalCalculatedSales > 0 || totalCalculatedExpenses > 0
            }];
          }
        }
      }

      // Get petty cash transactions with aggregation
      const aggregationPipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employeeInfo'
          }
        },
        // Lookup createdBy from both admins and adminusers collections
        {
          $lookup: {
            from: 'admins',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdByAdminInfo'
          }
        },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdByAdminUserInfo'
          }
        },
        // Lookup modifiedBy from both admins and adminusers collections
        {
          $lookup: {
            from: 'admins',
            localField: 'modifiedBy',
            foreignField: '_id',
            as: 'modifiedByAdminInfo'
          }
        },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'modifiedBy',
            foreignField: '_id',
            as: 'modifiedByAdminUserInfo'
          }
        },
        {
          $project: {
            _id: 1,
            date: 1,
            amount: 1,
            receiver: 1,
            description: 1,
            paymentMode: 1,
            transactionType: 1,
            isDelete: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            employeeId: {
              $cond: {
                if: { $gt: [{ $size: '$employeeInfo' }, 0] },
                then: { $arrayElemAt: ['$employeeInfo', 0] },
                else: null
              }
            },
            // Combine createdBy info from both collections
            createdBy: {
              $cond: {
                if: { $gt: [{ $size: '$createdByAdminInfo' }, 0] },
                then: { $arrayElemAt: ['$createdByAdminInfo', 0] },
                else: {
                  $cond: {
                    if: { $gt: [{ $size: '$createdByAdminUserInfo' }, 0] },
                    then: { $arrayElemAt: ['$createdByAdminUserInfo', 0] },
                    else: null
                  }
                }
              }
            },
            // Combine modifiedBy info from both collections
            modifiedBy: {
              $cond: {
                if: { $gt: [{ $size: '$modifiedByAdminInfo' }, 0] },
                then: { $arrayElemAt: ['$modifiedByAdminInfo', 0] },
                else: {
                  $cond: {
                    if: { $gt: [{ $size: '$modifiedByAdminUserInfo' }, 0] },
                    then: { $arrayElemAt: ['$modifiedByAdminUserInfo', 0] },
                    else: null
                  }
                }
              }
            }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      const [items, total, pettyCashManagement] = await Promise.all([
        PettyCashModel.aggregate(aggregationPipeline),
        PettyCashModel.countDocuments(query),
        Promise.resolve(pettyCashManagementData)
      ]);

      return {
        status: StatusCodes.OK,
        message: 'Transactions retrieved successfully',
        data: items,
        overallTotals: pettyCashManagement && pettyCashManagement.length > 0 ? pettyCashManagement[0] : null,
        // totalCount: total,
        // currentPage: page,
        // totalPages: Math.ceil(total / limit),
        // from: (page - 1) * limit + 1,
        // to: Math.min(page * limit, total),
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        from: skip + 1,
        to: Math.min(page * limit, total),
        // userType: superAdmin ? 'superadmin' : (adminUser ? 'adminuser' : 'unknown')
      };
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transactions",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateTransaction(id: string, data: UpdatePettyCashInput, userId: string): Promise<ApiResponse<IPettyCash> | ErrorResponse> {
    try {
      const transaction = await PettyCashModel.findById(id);
      if (!transaction) {
        return createErrorResponse(
          'Transaction not found',
          StatusCodes.NOT_FOUND,
          'Transaction with given ID not found'
        );
      }

      const updateData: any = { ...data };
      updateData.modifiedBy = new Types.ObjectId(userId);
      //   const documents: any = [];
      //   if (data?.documents as unknown as UploadedFile) {
      //     const image = await Uploads.processFiles(
      //         data?.documents,
      //         "petty-cash",
      //         "img",
      //         "doc",
      //         ""
      //     );
      //     documents.push(...image);

      // }
      // if (data.documents && data.documents.trim() !== '') {
      //     for (const val of data.documents.split(',')) {
      //         const imagesData = transaction.documents?.find((e) => e.docPath.toString() === val.trim());
      //         documents.push(imagesData);
      //     }
      // }
      //   if (documents.length > 0) {
      //     updateData.documents = documents;
      //   }
      if (data.date) {
        updateData.date = new Date(data.date);
      }

      const result = await PettyCashModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      if (!result) {
        return createErrorResponse(
          "Transaction not found",
          StatusCodes.NOT_FOUND
        );
      }

      return successResponse('Transaction updated successfully', StatusCodes.OK, result);
    } catch (error: any) {
      return createErrorResponse(
        "Failed to update transaction",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async deleteTransaction(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      const result = await PettyCashModel.findByIdAndUpdate(
        id,
        { isDelete: true },
        { new: true }
      );

      if (!result) {
        return createErrorResponse(
          'Transaction not found',
          StatusCodes.NOT_FOUND,
          'Transaction with given ID not found'
        );
      }

      return successResponse('Transaction deleted successfully', StatusCodes.OK, null);
    } catch (error: any) {
      return createErrorResponse(
        'Failed to delete transaction',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getDailySummary(params: PettyCashParams): Promise<PaginationResult<IPettyCash> | ErrorResponse> {
    try {
      const { page = 1, limit = 10, search, startDate, endDate, transactionType, paymentMode } = params;
      const skip = (page - 1) * limit;

      const query: any = { isDelete: false };

      if (search) {
        query.$or = [
          { receiver: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (transactionType) {
        query.transactionType = transactionType;
      }

      if (paymentMode) {
        query.paymentMode = paymentMode;
      }

      const [items, total] = await Promise.all([
        PettyCashModel.find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'employeeId',
            select: 'name',
          })
          .lean(),
        PettyCashModel.countDocuments(query),
      ]);

      return {
        status: StatusCodes.OK,
        message: 'Transactions retrieved successfully',
        data: items as any,
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        from: (page - 1) * limit + 1,
        to: Math.min(page * limit, total)
      };
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch transactions",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export function pettyCashRepository(): IPettyCashRepository {
  return new PettyCashRepository();
}
