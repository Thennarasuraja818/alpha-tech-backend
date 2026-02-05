// infrastructure/admin/boxCash.repository.ts
import { StatusCodes } from "http-status-codes";
import { BoxCashModel, IBoxCash } from "../../../app/model/BoxcashModel";
import { IBoxCashRepository, BoxCashParams } from "../../../domain/admin/boxCashDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { successResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { CreateBoxCashInput, UpdateBoxCashInput } from "../../../api/Request/boxCash";
import { PettyCashManagementModel } from "../../../app/model/pettyCash.management";
import { OrderModel } from "../../../app/model/order";
import moment from "moment";
import mongoose from "mongoose";
import { log } from "console";
import { BoxCashManagementModel } from "../../../app/model/boxCashManagement";
import ExpenseTypes from "../../../app/model/expense.type";

export class BoxCashRepository implements IBoxCashRepository {
    constructor() { }

    // infrastructure/admin/boxCash.repository.ts
    // infrastructure/admin/boxCash.repository.ts

    // async createTransaction(data: CreateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse> {
    //     const session = await mongoose.startSession();
    //     session.startTransaction();

    //     try {
    //         let pettyCashManagementId: mongoose.Types.ObjectId | undefined;

    //         // ONLY create PettyCashManagement for pettycash transactions with employee
    //         if (data.transactionType === 'pettycash' && data.employeeId && data.employeeId.length > 0) {
    //             const startOfDay = moment(data.date).toDate();
    //             console.log(data.date, "datadateeee");
    //             console.log(startOfDay, "sssss");

    //             const employeeId = data.employeeId[0];

    //             // Check if entry already exists for this employee and date
    //             const existingEntry = await PettyCashManagementModel.findOne({
    //                 date: { $gte: startOfDay, $lte: startOfDay },
    //                 receiver: new ObjectId(employeeId),
    //                 isDelete: false
    //             }).session(session);

    //             if (existingEntry) {
    //                 await session.abortTransaction();
    //                 return createErrorResponse(
    //                     `Petty cash entry already exists for this employee on ${moment(data.date).format('YYYY-MM-DD')}`,
    //                     StatusCodes.BAD_REQUEST,
    //                     "DUPLICATE_ENTRY"
    //                 );
    //             }

    //             // Create new PettyCashManagement entry
    //             const pettyCashManagement = new PettyCashManagementModel({
    //                 date: data.date,
    //                 initialAmount: data.amount,
    //                 salesAmount: 0,
    //                 closingAmount: 0,
    //                 receiver: new ObjectId(employeeId),
    //                 giver: new ObjectId(userId),
    //                 differenceAmount: 0,
    //                 differenceType: 'pending',
    //                 isDelete: false,
    //                 isActive: true,
    //                 createdBy: new ObjectId(userId),
    //                 modifiedBy: new ObjectId(userId)
    //             });

    //             await pettyCashManagement.save({ session });
    //             pettyCashManagementId = pettyCashManagement._id as mongoose.Types.ObjectId;
    //             console.log("Created PettyCashManagement with ID:", pettyCashManagementId);
    //         }

    //         // Create BoxCash transaction
    //         const transactionData: any = {
    //             ...data,
    //             createdBy: new ObjectId(userId),
    //             modifiedBy: new ObjectId(userId),
    //             isActive: true,
    //             isDelete: false,
    //         };

    //         // Set payment type
    //         if (data.transactionType === 'pettycash' || data.transactionType === 'expense' || data.transactionType === 'purchase' || data.transactionType === 'deposit') {
    //             transactionData.paymentType = "OUT";
    //         } else if (data.transactionType === 'withdraw' || data.transactionType === 'collection') {
    //             transactionData.paymentType = "IN";
    //         }

    //         // Add PettyCashManagement reference if created
    //         if (pettyCashManagementId) {
    //             transactionData.pettyCashManagementId = pettyCashManagementId;
    //         }

    //         // Convert employeeId strings to ObjectId
    //         if (data.employeeId && Array.isArray(data.employeeId) && data.employeeId.length > 0) {
    //             transactionData.employeeId = data.employeeId.map(id => new ObjectId(id));
    //         } else {
    //             transactionData.employeeId = [];
    //         }

    //         // Convert expenseType string to ObjectId if provided
    //         if (data.expenseType) {
    //             transactionData.expenseType = new ObjectId(data.expenseType);
    //         }

    //         const transaction = new BoxCashModel(transactionData);
    //         await transaction.save({ session });

    //         // Populate data for response
    //         const populatePaths: any[] = [];
    //         if (transactionData.employeeId.length > 0) {
    //             populatePaths.push({ path: 'employeeId', select: 'name fullName' });
    //         }
    //         if (pettyCashManagementId) {
    //             populatePaths.push({ path: 'pettyCashManagementId', select: 'initialAmount closingAmount date' });
    //         }
    //         if (data.expenseType) {
    //             populatePaths.push({ path: 'expenseType', select: 'name' });
    //         }

    //         if (populatePaths.length > 0) {
    //             await transaction.populate(populatePaths);
    //         }

    //         await session.commitTransaction();

    //         return successResponse('Transaction created successfully', StatusCodes.CREATED, transaction);
    //     } catch (error: any) {
    //         await session.abortTransaction();
    //         return createErrorResponse(
    //             "Failed to create transaction",
    //             StatusCodes.INTERNAL_SERVER_ERROR,
    //             error.message
    //         );
    //     } finally {
    //         session.endSession();
    //     }
    // }

    async createTransaction(data: CreateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let pettyCashManagementId: mongoose.Types.ObjectId | undefined;

            const startOfDay = moment(data.date).startOf('day').toDate();
            const targetDate = moment(data.date).startOf('day').toDate();
            const targetDateEnd = moment(data.date).endOf('day').toDate();
            const today = moment().startOf('day').toDate();
            const isFutureDate = moment(data.date).isAfter(moment(), 'day');

            // ONLY create PettyCashManagement for pettycash transactions with employee
            if (data.transactionType === 'pettycash' && data.employeeId && data.employeeId.length > 0) {
                console.log(data.date, "datadateeee");
                console.log(startOfDay, "sssss");

                const employeeId = data.employeeId[0];

                // Check if entry already exists for this employee and date
                const existingEntry = await PettyCashManagementModel.findOne({
                    date: { $gte: startOfDay, $lte: startOfDay },
                    receiver: new Types.ObjectId(employeeId),
                    isDelete: false
                }).session(session);

                if (existingEntry) {
                    await session.abortTransaction();
                    return createErrorResponse(
                        `Petty cash entry already exists for this employee on ${moment(data.date).format('YYYY-MM-DD')}`,
                        StatusCodes.BAD_REQUEST,
                        "DUPLICATE_ENTRY"
                    );
                }

                // Create new PettyCashManagement entry
                const pettyCashManagement = new PettyCashManagementModel({
                    date: data.date,
                    initialAmount: data.amount,
                    salesAmount: 0,
                    closingAmount: 0,
                    receiver: new Types.ObjectId(employeeId),
                    giver: new Types.ObjectId(userId),
                    differenceAmount: 0,
                    differenceType: 'pending',
                    isDelete: false,
                    isActive: true,
                    createdBy: new Types.ObjectId(userId),
                    modifiedBy: new Types.ObjectId(userId)
                });

                await pettyCashManagement.save({ session });
                pettyCashManagementId = pettyCashManagement._id as Types.ObjectId;
                console.log("Created PettyCashManagement with ID:", pettyCashManagementId);

                // ✅ NEW CONDITION: If pettycash is for future date, create automatic expense for today
                if (isFutureDate) {
                    console.log("Future date detected, creating automatic OP CASH expense for today");

                    // Find or create "OP CASH" expense type
                    let opCashExpenseType = await ExpenseTypes.findOne({
                        name: "OP CASH",
                        isDelete: false
                    }).session(session);

                    if (!opCashExpenseType) {
                        // Create "OP CASH" expense type if it doesn't exist
                        opCashExpenseType = new ExpenseTypes({
                            name: "OP CASH",
                            isDelete: false,
                            isActive: true,
                            createdBy: new Types.ObjectId(userId),
                            modifiedBy: new Types.ObjectId(userId)
                        });
                        await opCashExpenseType.save({ session });
                        console.log("Created OP CASH expense type with ID:", opCashExpenseType._id);
                    }

                    // Create automatic expense transaction for today
                    const expenseTransactionData = {
                        transactionType: 'expense' as const,
                        date: today, // Today's date
                        amount: data.amount,
                        userType: 'employee' as const,
                        employeeId: data.employeeId,
                        expenseType: opCashExpenseType._id,
                        description: `Automatic OP CASH expense for future petty cash (${moment(data.date).format('YYYY-MM-DD')})`,
                        createdBy: new Types.ObjectId(userId),
                        modifiedBy: new Types.ObjectId(userId),
                        isActive: true,
                        isDelete: false,
                        paymentType: "OUT" as const
                    };

                    const expenseTransaction = new BoxCashModel(expenseTransactionData);
                    await expenseTransaction.save({ session });
                    console.log("Created automatic OP CASH expense transaction with ID:", expenseTransaction._id);
                }
            }

            // Create BoxCash transaction
            const transactionData: any = {
                ...data,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
                isActive: true,
                isDelete: false,
            };

            // Set payment type
            if (data.transactionType === 'pettycash' || data.transactionType === 'expense' || data.transactionType === 'purchase' || data.transactionType === 'deposit') {
                transactionData.paymentType = "OUT";
            } else if (data.transactionType === 'withdraw' || data.transactionType === 'collection') {
                transactionData.paymentType = "IN";
            }

            // Add PettyCashManagement reference if created
            if (pettyCashManagementId) {
                transactionData.pettyCashManagementId = pettyCashManagementId;
            }

            // Convert employeeId strings to ObjectId
            if (data.employeeId && Array.isArray(data.employeeId) && data.employeeId.length > 0) {
                transactionData.employeeId = data.employeeId.map(id => new Types.ObjectId(id));
            } else {
                transactionData.employeeId = [];
            }

            // Convert expenseType string to ObjectId if provided
            if (data.expenseType) {
                transactionData.expenseType = new Types.ObjectId(data.expenseType);
            }

            const transaction = new BoxCashModel(transactionData);
            await transaction.save({ session });

            // Populate data for response
            const populatePaths: any[] = [];
            if (transactionData.employeeId.length > 0) {
                populatePaths.push({ path: 'employeeId', select: 'name fullName' });
            }
            if (pettyCashManagementId) {
                populatePaths.push({ path: 'pettyCashManagementId', select: 'initialAmount closingAmount date' });
            }
            if (data.expenseType) {
                populatePaths.push({ path: 'expenseType', select: 'name' });
            }

            if (populatePaths.length > 0) {
                await transaction.populate(populatePaths);
            }

            await session.commitTransaction();

            // ✅ Check if BoxCashManagement record exists and update difference
            const existingBoxCashManagement = await BoxCashManagementModel.findOne({
                date: {
                    $gte: targetDate,
                    $lte: targetDateEnd
                },
                isDelete: false
            }).session(session);

            console.log(existingBoxCashManagement, "existingBoxCashManagement");

            if (existingBoxCashManagement && existingBoxCashManagement.closingBalance > 0) {
                // Recalculate amounts from BoxCash transactions
                const amounts = await this.calculateAmountsFromBoxCash(targetDate);

                // Calculate opening balance from previous day
                const openingBalance = await this.calculateOpeningBalance(targetDate);

                // Calculate closing balance using the same method
                const closingBalance = this.calculateClosingBalance(
                    openingBalance,
                    amounts,
                    existingBoxCashManagement.closingBalance
                );

                console.log("Calculated amounts:", amounts);
                console.log("Opening balance:", openingBalance);
                console.log("Closing balance:", closingBalance);

                // Calculate difference
                const rawDifference = existingBoxCashManagement.closingBalance - closingBalance;
                const differenceAmount = Math.abs(rawDifference);
                const differenceType = rawDifference > 0 ? 'excess' : rawDifference < 0 ? 'shortage' : 'balanced';

                console.log("Actual Closing Amount:", existingBoxCashManagement.closingBalance);
                console.log("Difference Amount:", differenceAmount);
                console.log("Difference Type:", differenceType);

                // Update only difference fields, not closing amount
                await BoxCashManagementModel.updateOne(
                    { _id: existingBoxCashManagement._id },
                    {
                        $set: {
                            differenceAmount: differenceAmount,
                            differenceType: differenceType,
                            modifiedBy: new Types.ObjectId(userId),
                            updatedAt: new Date()
                        }
                    }
                ).session(session);
            }

            return successResponse('Transaction created successfully', StatusCodes.CREATED, transaction);
        } catch (error: any) {
            await session.abortTransaction();
            return createErrorResponse(
                "Failed to create transaction",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } finally {
            session.endSession();
        }
    }

    // Add these helper methods if they don't exist in your class
    private async calculateAmountsFromBoxCash(targetDate: Date): Promise<any> {
        // Your existing implementation from createBoxCashManagement
        const startOfDay = moment(targetDate).startOf('day').toDate();
        const endOfDay = moment(targetDate).endOf('day').toDate();
        const amounts = await BoxCashModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    },
                    isDelete: false
                }
            },
            {
                $group: {
                    _id: '$transactionType',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const result = {
            pettyCashOpeningAmount: 0,
            expenseAmount: 0,
            purchaseAmount: 0,
            withdrawAmount: 0,
            depositAmount: 0,
            collectionAmount: 0,
            pettyCashClosingAmount: 0
        };

        amounts.forEach(item => {
            switch (item._id) {
                case 'pettycash':
                    // Check payment type to determine if it's opening or closing
                    // You might need to adjust this logic based on your paymentType
                    // result.pettyCashOpeningAmount += item.totalAmount;
                    break;
                case 'expense':
                    result.expenseAmount += item.totalAmount;
                    break;
                case 'purchase':
                    result.purchaseAmount += item.totalAmount;
                    break;
                case 'withdraw':
                    result.withdrawAmount += item.totalAmount;
                    break;
                case 'deposit':
                    result.depositAmount += item.totalAmount;
                    break;
                case 'collection':
                    result.collectionAmount += item.totalAmount;
                    break;
            }
        });
        // Calculate petty cash amounts separately based on paymentType
        const pettyCashAmounts = await BoxCashModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    },
                    transactionType: 'pettycash',
                    isDelete: false
                }
            },
            {
                $group: {
                    _id: '$paymentType',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);
        console.log(pettyCashAmounts, "pettyCashAmounts");

        pettyCashAmounts.forEach(item => {
            if (item._id === 'OUT') {
                result.pettyCashOpeningAmount += item.totalAmount;
            } else if (item._id === 'IN') {
                result.pettyCashClosingAmount += item.totalAmount;
            }
        });

        return result;
    }

    private async calculateOpeningBalance(targetDate: Date): Promise<number> {
        // Your existing implementation from createBoxCashManagement
        const previousDay = moment.utc(targetDate).subtract(1, 'day').endOf('day').toDate();

        const previousRecord = await BoxCashManagementModel.findOne({
            date: {
                $lte: previousDay
            },
            isDelete: false
        }).sort({ date: -1 });

        return previousRecord ? previousRecord.closingBalance : 0;
    }

    private calculateClosingBalance(
        openingBalance: number,
        amounts: any,
        closingAmount: number
    ): number {
        // Formula: Opening Balance + (Collection + Deposit + Closing Petty Cash) - (Expense + Purchase + Withdraw + Opening Petty Cash)
        const totalIncoming = amounts.collectionAmount + amounts.withdrawAmount + amounts.pettyCashClosingAmount;
        const totalOutgoing = amounts.expenseAmount + amounts.purchaseAmount + amounts.depositAmount + amounts.pettyCashOpeningAmount;

        console.log(totalIncoming, "inco");
        console.log(totalOutgoing, "out");
        console.log(closingAmount, "close");
        console.log(openingBalance, "openb");

        const calculatedBalance = openingBalance + totalIncoming - totalOutgoing;
        console.log(calculatedBalance, "Calcl");

        // Ensure the closing balance is never negative
        return Math.max(0, calculatedBalance);
    }

    async getTransactionById(id: string): Promise<ApiResponse<IBoxCash> | ErrorResponse> {
        try {
            const transaction = await BoxCashModel.findOne({ _id: id, isDelete: false })
                .populate({
                    path: 'employeeId',
                    select: 'name fullName'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name'
                })
                .populate({
                    path: 'modifiedBy',
                    select: 'name'
                });

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

    async getAllTransactions(params: BoxCashParams): Promise<any | ErrorResponse> {
        try {
            const { page = 1, limit = 10, search, startDate, endDate, transactionType, userType } = params;
            const skip = (page - 1) * limit;

            const match: any = { isDelete: false };

            if (search) {
                match.$or = [
                    { receiver: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }

            if (startDate && endDate) {
                match.date = {
                    $gte: moment(startDate).startOf("day").toDate(),
                    $lte: moment(endDate).endOf("day").toDate(),
                };
            }

            if (transactionType) {
                match.transactionType = transactionType;
            }

            if (userType) {
                match.userType = userType;
            }

            const pipeline: any[] = [
                { $match: match },
                { $sort: { date: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                // Lookup employee details
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'employeeId',
                        foreignField: '_id',
                        as: 'employeeId'
                    }
                },
                // Lookup createdBy details
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                {
                    $unwind: {
                        path: '$createdBy',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Lookup expense type details
                {
                    $lookup: {
                        from: 'expensetypes',
                        localField: 'expenseType',
                        foreignField: '_id',
                        as: 'expenseType'
                    }
                },
                {
                    $unwind: {
                        path: '$expenseType',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Lookup petty cash management details with denominations
                {
                    $lookup: {
                        from: 'pettycashmanagements',
                        localField: 'pettyCashManagementId',
                        foreignField: '_id',
                        as: 'pettyCashManagementId'
                    }
                },
                {
                    $unwind: {
                        path: '$pettyCashManagementId',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Lookup receiver details from petty cash management
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'pettyCashManagementId.receiver',
                        foreignField: '_id',
                        as: 'pettyCashManagementId.receiver'
                    }
                },
                {
                    $unwind: {
                        path: '$pettyCashManagementId.receiver',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Lookup giver details from petty cash management
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'pettyCashManagementId.giver',
                        foreignField: '_id',
                        as: 'pettyCashManagementId.giver'
                    }
                },
                {
                    $unwind: {
                        path: '$pettyCashManagementId.giver',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Lookup handover details from petty cash management
                {
                    $lookup: {
                        from: 'adminusers',
                        localField: 'pettyCashManagementId.handover',
                        foreignField: '_id',
                        as: 'pettyCashManagementId.handover'
                    }
                },
                {
                    $unwind: {
                        path: '$pettyCashManagementId.handover',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project only required fields
                {
                    $project: {
                        transactionType: 1,
                        date: 1,
                        userType: 1,
                        employeeId: {
                            $map: {
                                input: '$employeeId',
                                as: 'emp',
                                in: {
                                    _id: '$$emp._id',
                                    name: '$$emp.name',
                                    fullName: '$$emp.fullName'
                                }
                            }
                        },
                        receiver: 1,
                        amount: 1,
                        description: 1,
                        expenseType: { // Include expense type in projection
                            _id: '$expenseType._id',
                            name: '$expenseType.name'
                        },
                        openingBalance: 1,
                        closingBalance: 1,
                        paymentType: 1,
                        createdBy: {
                            _id: '$createdBy._id',
                            name: '$createdBy.name'
                        },
                        pettyCashManagementId: {
                            _id: '$pettyCashManagementId._id',
                            initialAmount: '$pettyCashManagementId.initialAmount',
                            salesAmount: '$pettyCashManagementId.salesAmount',
                            expensesAmount: '$pettyCashManagementId.expensesAmount',
                            closingAmount: '$pettyCashManagementId.closingAmount',
                            differenceAmount: '$pettyCashManagementId.differenceAmount',
                            differenceType: '$pettyCashManagementId.differenceType',
                            denominations: '$pettyCashManagementId.denominations',
                            receiver: {
                                _id: '$pettyCashManagementId.receiver._id',
                                name: '$pettyCashManagementId.receiver.name'
                            },
                            giver: {
                                _id: '$pettyCashManagementId.giver._id',
                                name: '$pettyCashManagementId.giver.name'
                            },
                            handover: {
                                _id: '$pettyCashManagementId.handover._id',
                                name: '$pettyCashManagementId.handover.name'
                            },
                            date: '$pettyCashManagementId.date'
                        },
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ];

            // ... rest of the getAllTransactions method remains the same
            // (the overall totals calculation part)
            //         // Calculate overall totals for the date range
            let overallTotals = null;
            if (startDate && endDate) {
                // Get BoxCash totals
                const totalsPipeline: any[] = [
                    {
                        $match: {
                            isDelete: false,
                            date: {
                                $gte: moment(startDate).startOf("day").toDate(),
                                $lte: moment(endDate).endOf("day").toDate(),
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            // 1. Total opening balance - pettycash transaction type with paymentType OUT
                            totalOpeningBalance: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $eq: ["$transactionType", "pettycash"] },
                                                { $eq: ["$paymentType", "OUT"] }
                                            ]
                                        },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // 2. Total expense - expense transaction type
                            totalExpense: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$transactionType", "expense"] },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // 3. Total purchase - purchase transaction type
                            totalPurchase: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$transactionType", "purchase"] },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // 4. Total withdraw - withdraw transaction type
                            totalWithdraw: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$transactionType", "withdraw"] },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // 5. Total deposit - deposit transaction type
                            totalDeposit: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$transactionType", "deposit"] },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // 6. Total collection - collection transaction type
                            totalCollection: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$transactionType", "collection"] },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // 7. Total closing amount - pettycash transaction type with paymentType IN
                            totalClosingAmount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$transactionType",
                                                        "pettycash"
                                                    ]
                                                },
                                                {
                                                    $eq: ["$paymentType", "IN"]
                                                }
                                            ]
                                        },
                                        "$amount",
                                        0
                                    ]
                                }
                            },
                            // Count of all transactions for this date range
                            totalTransactions: { $sum: 1 }
                        }
                    }
                ];

                const totalsResult = await BoxCashModel.aggregate(totalsPipeline);
                console.log(totalsResult, "BoxCash Totals Result");
                console.log(startDate, "startDate");
                console.log(endDate, "endDate");


                // Get BoxCashManagement opening and closing balances for the date range
                const boxCashManagementTotals = await BoxCashManagementModel.aggregate([
                    {
                        $match: {
                            isDelete: false,
                            date: {
                                $gte: moment(startDate).startOf("day").toDate(),
                                $lte: moment(endDate).endOf("day").toDate(),
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            // Get the first day's opening balance and last day's closing balance
                            firstDayOpeningBalance: { $first: "$openingBalance" },
                            lastDayClosingBalance: { $last: "$closingBalance" },
                            // Also get averages or totals if needed
                            totalOpeningBalance: { $sum: "$openingBalance" },
                            totalClosingBalance: { $sum: "$closingBalance" },
                            differenceAmount: { $sum: "$differenceAmount" },
                            differenceType: { $last: "$differenceType" },
                            // Count of records in this date range
                            recordCount: { $sum: 1 },
                            // Denomination data - get all denominations from all records
                            allDenominations: { $push: "$denominations" },

                        }

                    },
                    {
                        $project: {
                            _id: 0,
                            firstDayOpeningBalance: 1,
                            lastDayClosingBalance: 1,
                            totalOpeningBalance: 1,
                            totalClosingBalance: 1,
                            differenceAmount: 1,
                            differenceType: 1,
                            // Flatten all denominations into a single array
                            allDenominations: {
                                $reduce: {
                                    input: "$allDenominations",
                                    initialValue: [],
                                    in: { $concatArrays: ["$$value", "$$this"] }
                                }
                            },
                        }
                    }
                ]);

                console.log(boxCashManagementTotals, "BoxCashManagement Totals");

                // Calculate current balance from BoxCash transactions
                const currentBalance = totalsResult.length > 0 ?
                    (totalsResult[0].totalWithdraw + totalsResult[0].totalCollection + totalsResult[0].totalClosingAmount + (boxCashManagementTotals[0]?.firstDayOpeningBalance || 0)) -
                    (totalsResult[0].totalOpeningBalance + totalsResult[0].totalDeposit + totalsResult[0].totalExpense + totalsResult[0].totalPurchase)
                    : 0;
                //                 console.log((totalsResult[0].totalWithdraw + totalsResult[0].totalCollection + totalsResult[0].totalClosingAmount + (boxCashManagementTotals[0]?.firstDayOpeningBalance || 0)));
                // console.log((totalsResult[0].totalOpeningBalance + totalsResult[0].totalDeposit + totalsResult[0].totalExpense + totalsResult[0].totalPurchase));

                // console.log(currentBalance, "Current Balance");

                if (totalsResult.length > 0) {
                    overallTotals = {
                        // BoxCash transaction totals
                        totalOpeningBalance: totalsResult[0].totalOpeningBalance || 0,
                        totalExpense: totalsResult[0].totalExpense || 0,
                        totalPurchase: totalsResult[0].totalPurchase || 0,
                        totalWithdraw: totalsResult[0].totalWithdraw || 0,
                        totalDeposit: totalsResult[0].totalDeposit || 0,
                        totalCollection: totalsResult[0].totalCollection || 0,
                        totalClosingAmount: totalsResult[0].totalClosingAmount || 0,
                        totalTransactions: totalsResult[0].totalTransactions || 0,
                        currentBalance: currentBalance,
                        differenceAmount: boxCashManagementTotals.length > 0 ?
                            (boxCashManagementTotals[0].differenceAmount || 0) : 0,
                        differenceType: boxCashManagementTotals.length > 0 ?
                            (boxCashManagementTotals[0].differenceType || "pending") : "pending",
                        // BoxCashManagement balances
                        openingBalance: boxCashManagementTotals.length > 0 ?
                            (boxCashManagementTotals[0].firstDayOpeningBalance || 0) : 0,
                        closingBalance: boxCashManagementTotals.length > 0 ?
                            (boxCashManagementTotals[0].lastDayClosingBalance || 0) : 0,
                        denamination: boxCashManagementTotals.length > 0 ?
                            (boxCashManagementTotals[0].allDenominations || []) : [],
                        // Additional BoxCashManagement info
                        boxCashManagementRecordCount: boxCashManagementTotals.length > 0 ?
                            boxCashManagementTotals[0].recordCount : 0,

                        dateRange: {
                            startDate: startDate,
                            endDate: endDate
                        }
                    };
                } else {
                    overallTotals = {
                        // BoxCash transaction totals
                        totalOpeningBalance: 0,
                        totalExpense: 0,
                        totalPurchase: 0,
                        totalWithdraw: 0,
                        totalDeposit: 0,
                        totalCollection: 0,
                        totalClosingAmount: 0,
                        totalTransactions: 0,
                        currentBalance: 0,

                        // BoxCashManagement balances
                        openingBalance: 0,
                        closingBalance: 0,

                        // Additional BoxCashManagement info
                        boxCashManagementRecordCount: 0,
                        denamination: [],
                        dateRange: {
                            startDate: startDate,
                            endDate: endDate
                        }
                    };
                }
            }
            console.log(overallTotals, "Overall Totals");

            const [items, total] = await Promise.all([
                BoxCashModel.aggregate(pipeline),
                BoxCashModel.countDocuments(match),
            ]);

            return {
                status: StatusCodes.OK,
                message: 'Transactions retrieved successfully',
                data: items,
                overallTotals: overallTotals as any,
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

    async updateTransaction(id: string, data: UpdateBoxCashInput, userId: string): Promise<ApiResponse<IBoxCash> | ErrorResponse> {
        try {
            const transaction = await BoxCashModel.findById(id);
            if (!transaction) {
                return createErrorResponse(
                    'Transaction not found',
                    StatusCodes.NOT_FOUND,
                    'Transaction with given ID not found'
                );
            }

            const updateData: any = { ...data };
            updateData.modifiedBy = new Types.ObjectId(userId);

            if (data.employeeId && Array.isArray(data.employeeId)) {
                updateData.employeeId = data.employeeId.map(empId => new Types.ObjectId(empId));
            }

            const result = await BoxCashModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            ).populate({
                path: 'employeeId',
                select: 'name fullName'
            });

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
            const result = await BoxCashModel.findByIdAndUpdate(
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

    async getDailySummary(params: BoxCashParams): Promise<PaginationResult<IBoxCash> | ErrorResponse> {
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
                BoxCashModel.find(query)
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate({
                        path: 'employeeId',
                        select: 'name fullName'
                    })
                    .lean(),
                BoxCashModel.countDocuments(query),
            ]);

            return {
                status: StatusCodes.OK,
                message: 'Daily summary retrieved successfully',
                data: items as any,
                totalCount: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                from: (page - 1) * limit + 1,
                to: Math.min(page * limit, total)
            };
        } catch (error: any) {
            return createErrorResponse(
                "Failed to fetch daily summary",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function boxCashRepository(): IBoxCashRepository {
    return new BoxCashRepository();
}