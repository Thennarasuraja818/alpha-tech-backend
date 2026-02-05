import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { CreatePettyCashManagementInput, UpdatePettyCashManagementInput } from "../../../api/Request/pettyCashManagement";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { PettyCashManagementModel, IPettyCashManagement } from "../../../app/model/pettyCash.management";
import { OrderModel } from "../../../app/model/order";
import { PettyCashModel } from "../../../app/model/pettyCash";
import AdminUsers from "../../../app/model/admin.user";
import Admin from "../../../app/model/admin";
import { PaymentReceiveModel } from "../../../app/model/paymentReceive";
import moment from "moment";
import mongoose from "mongoose";
import { IPettyCashManagementRepository, PettyCashManagementParams } from "../../../domain/admin/pettyCashManagementDomain";
import { BoxCashModel } from "../../../app/model/BoxcashModel";

export class PettyCashManagementRepository implements IPettyCashManagementRepository {
  constructor() { }

  async createPettyCashManagement(data: CreatePettyCashManagementInput, userId: string): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse> {
    try {
      const shift = new PettyCashManagementModel({
        ...data,
        initialAmount: data.initialAmount,
        giver: new Types.ObjectId(data.giver),
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        isActive: true,
        isDelete: false,
        date: new Date(data.date),
      });

      await shift.save();
      return successResponse("Petty cash shift created successfully", StatusCodes.CREATED, shift);
    } catch (error: any) {
      return createErrorResponse("Failed to create petty cash shift", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getPettyCashManagementById(id: string): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse> {
    try {
      const shift = await PettyCashManagementModel.findOne({ _id: id, isDelete: false })
        .populate("giver", "name")
        .populate("receiver", "name");

      if (!shift) {
        return createErrorResponse("Petty cash shift not found", StatusCodes.NOT_FOUND);
      }

      return successResponse("Petty cash shift retrieved successfully", StatusCodes.OK, shift);
    } catch (error: any) {
      return createErrorResponse("Failed to fetch petty cash shift", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // async getAllPettyCashManagement(params: PettyCashManagementParams, userId: string): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse> {
  //   try {
  //     const { page = 1, limit = 10, search, startDate, endDate } = params;
  //     const skip = (page - 1) * limit;

  //     const match: any = { isDelete: false };

  //     if (search) {
  //       match.$or = [
  //         { initialAmount: { $regex: search, $options: "i" } },
  //         { closingAmount: { $regex: search, $options: "i" } },
  //       ];
  //     }

  //     if (startDate && endDate) {
  //       match.date = {
  //         $gte: new Date(startDate),
  //         $lte: new Date(endDate),
  //       };
  //     }

  //     const userObjectId = new ObjectId(userId);

  //     // Check user type in parallel
  //     const [adminUser, superAdmin] = await Promise.all([
  //       AdminUsers.findOne({ _id: userObjectId, isDelete: false }),
  //       Admin.findOne({ _id: userObjectId, isDelete: false })
  //     ]);

  //     // If user is AdminUser (employee/biller) but NOT super admin, filter by giver
  //     if (adminUser && !superAdmin) {
  //       match.receiver = userObjectId;
  //     }
  //     // If user is super admin (from admins collection), show all data

  //     const pipeline: any[] = [
  //       { $match: match },
  //       {
  //         $lookup: {
  //           from: "admins",
  //           localField: "giver",
  //           foreignField: "_id",
  //           as: "giver",
  //         },
  //       },
  //       { $unwind: { path: "$giver", preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: "adminusers",
  //           localField: "receiver",
  //           foreignField: "_id",
  //           as: "receiver",
  //         },
  //       },
  //       { $unwind: { path: "$receiver", preserveNullAndEmptyArrays: true } },
  //       { $sort: { date: -1 } },
  //       { $skip: skip },
  //       { $limit: limit },
  //     ];

  //     const [items, totalCount] = await Promise.all([
  //       PettyCashManagementModel.aggregate(pipeline),
  //       PettyCashManagementModel.countDocuments(match),
  //     ]);

  //     return {
  //       status: StatusCodes.OK,
  //       message: "Petty cash shifts retrieved successfully",
  //       data: items,
  //       totalCount,
  //       currentPage: page,
  //       totalPages: Math.ceil(totalCount / limit),
  //       from: skip + 1,
  //       to: Math.min(page * limit, totalCount),
  //     };
  //   } catch (error: any) {
  //     return createErrorResponse(
  //       "Failed to fetch petty cash shifts",
  //       StatusCodes.INTERNAL_SERVER_ERROR,
  //       error.message
  //     );
  //   }
  // }

  async getAllPettyCashManagement(params: PettyCashManagementParams, userId: string): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse> {
    try {
      const { page, limit, search, startDate, endDate } = params;
      const skip = page * limit;

      const match: any = { isDelete: false };

      if (search) {
        match.$or = [
          { initialAmount: { $regex: search, $options: "i" } },
          { closingAmount: { $regex: search, $options: "i" } },
        ];
      }

      if (startDate && endDate) {
        match.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const userObjectId = new Types.ObjectId(userId);

      // Check user type in parallel
      const [adminUser, superAdmin] = await Promise.all([
        AdminUsers.findOne({ _id: userObjectId, isDelete: false }),
        Admin.findOne({ _id: userObjectId, isDelete: false })
      ]);

      // If user is AdminUser (employee/biller) but NOT super admin, filter by giver
      if (adminUser && !superAdmin) {
        match.receiver = userObjectId;
      }
      // If user is super admin (from admins collection), show all data

      const pipeline: any[] = [
        { $match: match },
        {
          $lookup: {
            from: "admins",
            localField: "giver",
            foreignField: "_id",
            as: "giver",
          },
        },
        { $unwind: { path: "$giver", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "adminusers",
            localField: "receiver",
            foreignField: "_id",
            as: "receiver",
          },
        },
        { $unwind: { path: "$receiver", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const [items, totalCount] = await Promise.all([
        PettyCashManagementModel.aggregate(pipeline),
        PettyCashManagementModel.countDocuments(match),
      ]);

      // Process items to calculate salesAmount and expensesAmount for records with closingAmount: 0
      const processedItems = await Promise.all(
        items.map(async (item) => {
          // If closingAmount is 0, calculate salesAmount and expensesAmount from related models
          if (item.closingAmount === 0 || item.closingAmount === null) {
            const shiftStartDate = new Date(item.date);
            const shiftEndDate = new Date(item.date);
            shiftEndDate.setHours(23, 59, 59, 999);

            const receiverId = item.receiver?._id || item.receiver;

            try {
              // ✅ 1. Get POS orders for the shift to find order IDs
              const posOrders = await OrderModel.find({
                orderFrom: "pos",
                createdAt: {
                  $gte: shiftStartDate,
                  $lte: shiftEndDate,
                },
                isDelete: false,
                // Only include orders created by the receiver (if receiver is available)
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
                    // Use receiver as createdBy if available, otherwise use the current userId
                    createdBy: receiverId ? new Types.ObjectId(receiverId) : userObjectId
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
                    // Use receiver as createdBy if available, otherwise use the current userId
                    createdBy: receiverId ? new Types.ObjectId(receiverId) : userObjectId,
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
                expensesAmount: totalExpenses
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

      console.log(processedItems, "processedItems");

      return {
        status: StatusCodes.OK,
        message: "Petty cash shifts retrieved successfully",
        data: processedItems,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        from: skip + 1,
        to: Math.min(page * limit, totalCount),
      };
    } catch (error: any) {
      return createErrorResponse(
        "Failed to fetch petty cash shifts",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updatePettyCashManagement(
    id: string,
    data: UpdatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse> {
    const session = await mongoose.startSession();
    console.log(data, "data...");

    try {
      await session.startTransaction();
      const shift = await PettyCashManagementModel.findById(id);
      console.log(shift, "Petty Cash Shift");

      if (!shift) {
        return createErrorResponse("Petty cash shift not found", StatusCodes.NOT_FOUND);
      }

      const updateData: any = { ...data };
      updateData.modifiedBy = new Types.ObjectId(userId);

      // Calculate date range for the shift
      const shiftStartDate = moment(shift.date).startOf('day').toDate();
      const shiftEndDate = moment(shift.date).endOf('day').toDate();

      console.log("Shift Date Range:", shiftStartDate, "to", shiftEndDate);
      console.log("User ID:", userId);

      // ✅ 1. Get POS orders for the shift to find order IDs
      const posOrders = await OrderModel.find({
        orderFrom: "pos",
        createdAt: {
          $gte: shiftStartDate,
          $lte: shiftEndDate,
        },
        isDelete: false
      }).select('_id orderCode totalAmount paymentStatus');

      const orderIds = posOrders.map(order => order._id);
      console.log("POS Order IDs:", orderIds);

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
            createdBy: data.isAdmin ? shift.receiver : new Types.ObjectId(userId)
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
      const paymentCount = cashPaymentsAgg.length > 0 ? cashPaymentsAgg[0].paymentCount : 0;

      console.log("Cash Payments from PaymentReceives:", totalCashPayments);
      console.log("Number of Cash Payments:", paymentCount);

      // ✅ 3. Calculate total verified sales (Only cash payments from PaymentReceiveModel)
      const verifiedSales = totalCashPayments;
      console.log("Total Verified Sales (Cash Payments only):", verifiedSales);

      // ✅ 4. Calculate total expenses from PettyCashModel for this shift
      const pettyCashExpensesAgg = await PettyCashModel.aggregate([
        {
          $match: {
            createdBy: data.isAdmin ? shift.receiver : new Types.ObjectId(userId),
            date: {
              $gte: shiftStartDate,
              $lte: shiftEndDate,
            },
            transactionType: { $in: ['expense', 'purchase'] },
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
      const expenseCount = pettyCashExpensesAgg.length > 0 ? pettyCashExpensesAgg[0].expenseCount : 0;

      console.log("Total Petty Cash Expenses:", totalExpenses);
      console.log("Number of Expense Transactions:", expenseCount);

      // ✅ 5. Calculate expected closing amount
      if (shift.initialAmount == undefined) {
        return createErrorResponse(
          `Initial amount missing. Cannot compute closingAmount.`,
          StatusCodes.BAD_REQUEST
        );
      }

      console.log("Initial Amount:", shift.initialAmount);
      console.log("Verified Sales (Cash Payments):", verifiedSales);
      console.log("Total Expenses:", totalExpenses);

      const expectedClosingAmount = shift.initialAmount + verifiedSales - totalExpenses;
      console.log("Expected Closing Amount:", expectedClosingAmount);

      // ✅ 6. Calculate difference between actual closing and expected closing
      let actualClosingAmount = data.closingAmount ?? 0;

      // If denominations are provided, calculate closing amount from denominations
      if (data.denominations && data.denominations.length > 0) {
        const denominationsTotal = data.denominations.reduce((sum, denom) => sum + denom.total, 0);
        actualClosingAmount = denominationsTotal;
        console.log("Closing Amount calculated from denominations:", actualClosingAmount);
      }

      const rawDifference = actualClosingAmount - expectedClosingAmount;
      const differenceAmount = Math.abs(rawDifference);
      const differenceType = rawDifference > 0 ? 'excess' : rawDifference < 0 ? 'shortage' : 'balanced';

      console.log("Actual Closing Amount:", actualClosingAmount);
      console.log("Difference Amount:", differenceAmount);
      console.log("Difference Type:", differenceType);

      // ✅ 7. Update the shift data
      updateData.salesAmount = verifiedSales;
      updateData.expensesAmount = totalExpenses;
      updateData.closingAmount = actualClosingAmount;
      updateData.differenceAmount = differenceAmount;
      updateData.differenceType = differenceType;

      // ✅ 8. Add detailed breakdown for reporting
      updateData.salesBreakdown = {
        cashPayments: {
          amount: totalCashPayments,
          count: paymentCount
        },
        totalVerified: verifiedSales
      };

      updateData.expenseBreakdown = {
        totalExpenses: totalExpenses,
        transactionCount: expenseCount
      };

      // ✅ 9. Update receiver if provided
      if (data.handover) {
        updateData.handover = new Types.ObjectId(data.handover);
      }

      // ✅ 10. Update denominations if provided
      if (data.denominations) {
        updateData.denominations = data.denominations;
      }
      if (data.isAdmin) {
        updateData.adminApproved = true;
      }

      const result = await PettyCashManagementModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      if (!result) {
        return createErrorResponse("Failed to update petty cash shift", StatusCodes.NOT_FOUND);
      }
      // ✅ 7. Check if BoxCash transaction already exists for this petty cash
      const existingTransaction = await BoxCashModel.findOne({
        pettyCashManagementId: new mongoose.Types.ObjectId(id),
        transactionType: 'pettycash',
        paymentType: 'IN'
      }).session(session);

      const transactionData: any = {
        modifiedBy: new mongoose.Types.ObjectId(userId),
        amount: actualClosingAmount,
        description: `Petty cash closing amount`,
        date: new Date(),
      };

      // Add employeeId if receiver exists in the shift
      if (shift.receiver) {
        transactionData.employeeId = [new mongoose.Types.ObjectId(shift.receiver)];
        transactionData.userType = 'employee';
      } else if (data.receiver) {
        // If receiver is provided in the update data
        transactionData.employeeId = [new mongoose.Types.ObjectId(data.receiver)];
        transactionData.userType = 'employee';
      } else {
        // If no receiver, set as non-employee
        transactionData.receiver = "System";
        transactionData.userType = 'notEmployee';
      }

      console.log("Processing BoxCash transaction with data:", transactionData);

      if (existingTransaction) {
        // ✅ UPDATE existing transaction
        console.log("Updating existing BoxCash transaction:", existingTransaction._id);
        await BoxCashModel.findByIdAndUpdate(
          existingTransaction._id,
          { $set: transactionData },
          { session }
        );
        console.log("BoxCash transaction updated successfully");
      } else {
        // ✅ CREATE new transaction only if it doesn't exist
        console.log("Creating new BoxCash transaction");
        const newTransactionData = {
          ...transactionData,
          createdBy: new mongoose.Types.ObjectId(userId),
          isActive: true,
          isDelete: false,
          pettyCashManagementId: new mongoose.Types.ObjectId(id),
          paymentType: "IN",
          transactionType: "pettycash",
        };

        const transaction = new BoxCashModel(newTransactionData);
        await transaction.save({ session });
        console.log("New BoxCash transaction created successfully:", transaction._id);
      }

      // ✅ 8. Commit the transaction
      await session.commitTransaction();

      return successResponse("Petty cash shift updated successfully", StatusCodes.OK, result);
    } catch (error: any) {
      console.error("Error updating petty cash management:", error);
      return createErrorResponse(
        "Failed to update petty cash shift",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updatePettyCashManagementForAdmin(
    id: string,
    data: UpdatePettyCashManagementInput,
    userId: string
  ): Promise<ApiResponse<IPettyCashManagement> | ErrorResponse> {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();
      const shift: any = await PettyCashManagementModel.findById(id).session(session);
      console.log(shift, "Petty Cash Shift");

      if (!shift) {
        await session.abortTransaction();
        return createErrorResponse("Petty cash shift not found", StatusCodes.NOT_FOUND);
      }

      const updateData: any = {};
      updateData.modifiedBy = new mongoose.Types.ObjectId(userId);

      // ✅ 1. Calculate closing amount from denominations if provided
      let actualClosingAmount = data.closingAmount ?? shift.closingAmount;

      if (data.denominations && data.denominations.length > 0) {
        const denominationsTotal = data.denominations.reduce((sum, denom) => sum + denom.total, 0);
        actualClosingAmount = denominationsTotal;
        console.log("Closing Amount calculated from denominations:", actualClosingAmount);

        // Update denominations
        updateData.denominations = data.denominations;
      }

      // ✅ 2. Update closing amount
      updateData.closingAmount = actualClosingAmount;

      // ✅ 3. Calculate difference between actual closing and expected closing
      const expectedClosingAmount = shift.initialAmount + (shift.salesAmount || 0) - (shift.expensesAmount || 0);

      console.log("Initial Amount:", shift.initialAmount);
      console.log("Sales Amount:", shift.salesAmount);
      console.log("Expenses Amount:", shift.expensesAmount);
      console.log("Expected Closing Amount:", expectedClosingAmount);
      console.log("Actual Closing Amount (Admin):", actualClosingAmount);

      const rawDifference = actualClosingAmount - expectedClosingAmount;
      const differenceAmount = Math.abs(rawDifference);
      const differenceType = rawDifference > 0 ? 'excess' : rawDifference < 0 ? 'shortage' : 'balanced';

      console.log("Difference Amount:", differenceAmount);
      console.log("Difference Type:", differenceType);

      // ✅ 4. Update difference calculations
      updateData.differenceAmount = differenceAmount;
      updateData.differenceType = differenceType;
      updateData.adminApproved = true;

      // ✅ 5. Update handover if provided
      if (data.handover) {
        updateData.handover = new mongoose.Types.ObjectId(data.handover);
      }

      // ✅ 6. Update the shift with only the necessary fields
      const result = await PettyCashManagementModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, session }
      );

      if (!result) {
        await session.abortTransaction();
        return createErrorResponse("Failed to update petty cash shift", StatusCodes.NOT_FOUND);
      }

      // ✅ 7. Check if BoxCash transaction already exists for this petty cash
      const existingTransaction = await BoxCashModel.findOne({
        pettyCashManagementId: new mongoose.Types.ObjectId(id),
        transactionType: 'pettycash',
        paymentType: 'IN'
      }).session(session);

      const transactionData: any = {
        modifiedBy: new mongoose.Types.ObjectId(userId),
        amount: actualClosingAmount,
        description: `Petty cash closing amount`,
        date: new Date(),
      };

      // Add employeeId if receiver exists in the shift
      if (shift.receiver) {
        transactionData.employeeId = [new mongoose.Types.ObjectId(shift.receiver)];
        transactionData.userType = 'employee';
      } else if (data.receiver) {
        // If receiver is provided in the update data
        transactionData.employeeId = [new mongoose.Types.ObjectId(data.receiver)];
        transactionData.userType = 'employee';
      } else {
        // If no receiver, set as non-employee
        transactionData.receiver = "System";
        transactionData.userType = 'notEmployee';
      }

      console.log("Processing BoxCash transaction with data:", transactionData);

      if (existingTransaction) {
        // ✅ UPDATE existing transaction
        console.log("Updating existing BoxCash transaction:", existingTransaction._id);
        await BoxCashModel.findByIdAndUpdate(
          existingTransaction._id,
          { $set: transactionData },
          { session }
        );
        console.log("BoxCash transaction updated successfully");
      } else {
        // ✅ CREATE new transaction only if it doesn't exist
        console.log("Creating new BoxCash transaction");
        const newTransactionData = {
          ...transactionData,
          createdBy: new mongoose.Types.ObjectId(userId),
          isActive: true,
          isDelete: false,
          pettyCashManagementId: new mongoose.Types.ObjectId(id),
          paymentType: "IN",
          transactionType: "pettycash",
        };

        const transaction = new BoxCashModel(newTransactionData);
        await transaction.save({ session });
        console.log("New BoxCash transaction created successfully:", transaction._id);
      }

      // ✅ 8. Commit the transaction
      await session.commitTransaction();

      return successResponse("Petty cash shift updated successfully by admin", StatusCodes.OK, result);
    } catch (error: any) {
      // ✅ 9. Abort transaction on error
      await session.abortTransaction();
      console.error("Error updating petty cash management by admin:", error);
      return createErrorResponse(
        "Failed to update petty cash shift",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    } finally {
      // ✅ 10. Always end session
      await session.endSession();
    }
  }

  async deletePettyCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse> {
    try {
      const result = await PettyCashManagementModel.findByIdAndUpdate(id, { isDelete: true }, { new: true });

      if (!result) {
        return createErrorResponse("Petty cash shift not found", StatusCodes.NOT_FOUND);
      }

      return successResponse("Petty cash shift deleted successfully", StatusCodes.OK, null);
    } catch (error: any) {
      return createErrorResponse("Failed to delete petty cash shift", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getDailyPettyCashManagementSummary(params: PettyCashManagementParams): Promise<PaginationResult<IPettyCashManagement> | ErrorResponse> {
    try {
      const { page = 1, limit = 10, startDate, endDate } = params;
      const skip = (page - 1) * limit;

      const query: any = { isDelete: false };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const [items, total] = await Promise.all([
        PettyCashManagementModel.find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PettyCashManagementModel.countDocuments(query),
      ]);

      return {
        status: StatusCodes.OK,
        message: "Daily petty cash shift summary retrieved successfully",
        data: items as any,
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        from: skip + 1,
        to: Math.min(page * limit, total),
      };
    } catch (error: any) {
      return createErrorResponse("Failed to fetch summary", StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}

export function pettyCashManagementRepository(): IPettyCashManagementRepository {
  return new PettyCashManagementRepository();
}
