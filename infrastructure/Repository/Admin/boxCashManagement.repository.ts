import { StatusCodes } from "http-status-codes";
import { BoxCashManagementModel, IBoxCashManagement } from "../../../app/model/boxCashManagement";
import { IBoxCashManagementRepository, BoxCashManagementParams } from "../../../domain/admin/boxCashManagementDomain";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { successResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { CreateBoxCashManagementInput, UpdateBoxCashManagementInput } from "../../../api/Request/boxCashManagement";
import { BoxCashModel } from "../../../app/model/BoxcashModel";
import moment from "moment";
import mongoose from "mongoose";
import { log } from "console";

export class BoxCashManagementRepository implements IBoxCashManagementRepository {
    constructor() { }

    // private async calculateAmountsFromBoxCash(date: Date) {
    //     const startOfDay = moment(date).startOf('day').toDate();
    //     const endOfDay = moment(date).endOf('day').toDate();

    //     const amounts = await BoxCashModel.aggregate([
    //         {
    //             $match: {
    //                 date: {
    //                     $gte: startOfDay,
    //                     $lte: endOfDay
    //                 },
    //                 isDelete: false
    //             }
    //         },
    //         {
    //             $group: {
    //                 _id: '$transactionType',
    //                 totalAmount: { $sum: '$amount' }
    //             }
    //         }
    //     ]);

    //     // Initialize all amounts to 0
    //     const result = {
    //         pettyCashOpeningAmount: 0,
    //         expenseAmount: 0,
    //         purchaseAmount: 0,
    //         withdrawAmount: 0,
    //         depositAmount: 0,
    //         collectionAmount: 0,
    //         pettyCashClosingAmount: 0
    //     };

    //     // Map the aggregated results
    //     amounts.forEach(item => {
    //         switch (item._id) {
    //             case 'pettycash':
    //                 // For pettycash, we need to check paymentType to separate opening and closing
    //                 break;
    //             case 'expense':
    //                 result.expenseAmount = item.totalAmount;
    //                 break;
    //             case 'purchase':
    //                 result.purchaseAmount = item.totalAmount;
    //                 break;
    //             case 'withdraw':
    //                 result.withdrawAmount = item.totalAmount;
    //                 break;
    //             case 'deposit':
    //                 result.depositAmount = item.totalAmount;
    //                 break;
    //             case 'collection':
    //                 result.collectionAmount = item.totalAmount;
    //                 break;
    //         }
    //     });

    //     // Calculate petty cash amounts separately based on paymentType
    //     const pettyCashAmounts = await BoxCashModel.aggregate([
    //         {
    //             $match: {
    //                 date: {
    //                     $gte: startOfDay,
    //                     $lte: endOfDay
    //                 },
    //                 transactionType: 'pettycash',
    //                 isDelete: false
    //             }
    //         },
    //         {
    //             $group: {
    //                 _id: '$paymentType',
    //                 totalAmount: { $sum: '$amount' }
    //             }
    //         }
    //     ]);

    //     pettyCashAmounts.forEach(item => {
    //         if (item._id === 'OUT') {
    //             result.pettyCashOpeningAmount = item.totalAmount;
    //         } else if (item._id === 'IN') {
    //             result.pettyCashClosingAmount = item.totalAmount;
    //         }
    //     });

    //     return result;
    // }

    // private async calculateOpeningBalance(date: Date): Promise<number> {
    //     const startOfDay = moment(date).startOf('day').toDate();

    //     // Get the previous day's closing balance
    //     const previousDay = moment(date).subtract(1, 'day').endOf('day').toDate();

    //     const previousRecord = await BoxCashManagementModel.findOne({
    //         date: {
    //             $lte: previousDay
    //         },
    //         isDelete: false
    //     }).sort({ date: -1 });

    //     return previousRecord ? previousRecord.closingBalance : 0;
    // }

    // private calculateClosingBalance(
    //     openingBalance: number,
    //     amounts: any,
    //     closingAmount: number
    // ): number {
    //     // Formula: Opening Balance + (Collection + Deposit + Closing Petty Cash) - (Expense + Purchase + Withdraw + Opening Petty Cash)
    //     const totalIncoming = amounts.collectionAmount + amounts.depositAmount + closingAmount;
    //     const totalOutgoing = amounts.expenseAmount + amounts.purchaseAmount + amounts.withdrawAmount + amounts.pettyCashOpeningAmount;

    //     return openingBalance + totalIncoming - totalOutgoing;
    // }

    // async createBoxCashManagement(data: CreateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse> {
    //     const session = await mongoose.startSession();
    //     session.startTransaction();

    //     try {
    //         // Check if record already exists for this date
    //         const existingRecord = await BoxCashManagementModel.findOne({
    //             date: {
    //                 $gte: moment(data.date).startOf('day').toDate(),
    //                 $lte: moment(data.date).endOf('day').toDate()
    //             },
    //             isDelete: false
    //         }).session(session);

    //         if (existingRecord) {
    //             await session.abortTransaction();
    //             return createErrorResponse(
    //                 `Box cash management record already exists for ${moment(data.date).format('YYYY-MM-DD')}`,
    //                 StatusCodes.BAD_REQUEST,
    //                 "DUPLICATE_RECORD"
    //             );
    //         }

    //         // Calculate amounts from BoxCash transactions
    //         const amounts = await this.calculateAmountsFromBoxCash(data.date);

    //         // Calculate opening balance from previous day
    //         const openingBalance = await this.calculateOpeningBalance(data.date);

    //         // Calculate closing balance
    //         const closingBalance = this.calculateClosingBalance(
    //             openingBalance,
    //             amounts,
    //             data.closingAmount
    //         );

    //         // Create the box cash management record
    //         const boxCashManagementData = {
    //             date: data.date,
    //             pettyCashOpeningAmount: amounts.pettyCashOpeningAmount,
    //             expenseAmount: amounts.expenseAmount,
    //             purchaseAmount: amounts.purchaseAmount,
    //             withdrawAmount: amounts.withdrawAmount,
    //             depositAmount: amounts.depositAmount,
    //             collectionAmount: amounts.collectionAmount,
    //             pettyCashClosingAmount: data.closingAmount,
    //             openingBalance: openingBalance,
    //             closingBalance: closingBalance,
    //             denominations: data.denominations,
    //             description: data.description,
    //             isDelete: false,
    //             isActive: true,
    //             createdBy: new ObjectId(userId),
    //             modifiedBy: new ObjectId(userId)
    //         };

    //         const boxCashManagement = new BoxCashManagementModel(boxCashManagementData);
    //         await boxCashManagement.save({ session });

    //         await session.commitTransaction();

    //         return successResponse(
    //             'Box cash management record created successfully', 
    //             StatusCodes.CREATED, 
    //             boxCashManagement
    //         );
    //     } catch (error: any) {
    //         await session.abortTransaction();
    //         return createErrorResponse(
    //             "Failed to create box cash management record",
    //             StatusCodes.INTERNAL_SERVER_ERROR,
    //             error.message
    //         );
    //     } finally {
    //         session.endSession();
    //     }
    // }

    private async calculateAmountsFromBoxCash(date: Date) {
        const startOfDay = moment(date).startOf('day').toDate();
        const endOfDay = moment(date).endOf('day').toDate();

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

        // Initialize all amounts to 0
        const result = {
            pettyCashOpeningAmount: 0,
            expenseAmount: 0,
            purchaseAmount: 0,
            withdrawAmount: 0,
            depositAmount: 0,
            collectionAmount: 0,
            pettyCashClosingAmount: 0
        };

        // Map the aggregated results
        amounts.forEach(item => {
            switch (item._id) {
                case 'pettycash':
                    // For pettycash, we need to check paymentType to separate opening and closing
                    break;
                case 'expense':
                    result.expenseAmount = item.totalAmount;
                    break;
                case 'purchase':
                    result.purchaseAmount = item.totalAmount;
                    break;
                case 'withdraw':
                    result.withdrawAmount = item.totalAmount;
                    break;
                case 'deposit':
                    result.depositAmount = item.totalAmount;
                    break;
                case 'collection':
                    result.collectionAmount = item.totalAmount;
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
                result.pettyCashOpeningAmount = item.totalAmount;
            } else if (item._id === 'IN') {
                result.pettyCashClosingAmount = item.totalAmount;
            }
        });

        return result;
    }

    private async calculateOpeningBalance(date: Date): Promise<number> {
        const startOfDay = moment(date).startOf('day').toDate();

        // Get the previous day's closing balance
        const previousDay = moment(date).subtract(1, 'day').endOf('day').toDate();

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
    private async updateNextDayOpeningBalance(currentDate: Date, closingBalance: number, userId: string, session: mongoose.ClientSession) {
        try {
            console.log("Current Date:", currentDate);
            console.log("Current Date ISO:", currentDate.toISOString());

            // Use UTC to avoid timezone issues
            const nextDay = moment.utc(currentDate).add(1, 'day').startOf('day').toDate();
            console.log("Next Day:", nextDay);
            console.log("Next Day ISO:", nextDay.toISOString());

            // Create proper date range for query (start of next day to end of next day)
            const nextDayStart = moment.utc(nextDay).startOf('day').toDate();
            const nextDayEnd = moment.utc(nextDay).endOf('day').toDate();

            console.log("Next Day Start:", nextDayStart);
            console.log("Next Day End:", nextDayEnd);

            // Check if next day's record already exists
            const nextDayRecord = await BoxCashManagementModel.findOne({
                date: {
                    $gte: nextDayStart,
                    $lte: nextDayEnd
                },
                isDelete: false
            }).session(session);

            console.log("Found next day record:", nextDayRecord);

            if (nextDayRecord) {
                // Update existing next day record with new opening balance
                const safeOpeningBalance = Math.max(0, closingBalance);
                await BoxCashManagementModel.findByIdAndUpdate(
                    nextDayRecord._id,
                    {
                        $set: {
                            openingBalance: safeOpeningBalance,
                            modifiedBy: new Types.ObjectId(userId),
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );
                console.log(`Updated next day (${moment(nextDay).format('YYYY-MM-DD')}) opening balance to: ${safeOpeningBalance}`);
            } else {
                console.log("No existing record found for next day, creating new one...");

                // Check if there are BoxCash transactions for the next day
                const nextDayAmounts = await this.calculateAmountsFromBoxCash(nextDay);

                // Ensure closing balance is not negative
                const safeOpeningBalance = Math.max(0, closingBalance);

                // Calculate next day's closing balance with proper validation
                const nextDayClosingBalance = Math.max(0, this.calculateClosingBalance(
                    safeOpeningBalance,
                    nextDayAmounts,
                    0
                ));

                console.log("Next day amounts:", nextDayAmounts);
                console.log("Next day closing balance:", nextDayClosingBalance);

                // Create new record for next day
                const nextDayData = {
                    date: nextDayStart, // Use the start of day to ensure consistent date storage
                    pettyCashOpeningAmount: nextDayAmounts.pettyCashOpeningAmount,
                    expenseAmount: nextDayAmounts.expenseAmount,
                    purchaseAmount: nextDayAmounts.purchaseAmount,
                    withdrawAmount: nextDayAmounts.withdrawAmount,
                    depositAmount: nextDayAmounts.depositAmount,
                    collectionAmount: nextDayAmounts.collectionAmount,
                    pettyCashClosingAmount: 0,
                    openingBalance: safeOpeningBalance,
                    differenceAmount: 0,
                    differenceType: 'pending',
                    closingBalance: 0,
                    denominations: [],
                    description: `Auto-generated from previous day's closing (${moment(currentDate).format('YYYY-MM-DD')})`,
                    isDelete: false,
                    isActive: true,
                    createdBy: new Types.ObjectId(userId),
                    modifiedBy: new Types.ObjectId(userId)
                };

                console.log("Creating next day record with data:", nextDayData);

                const nextDayBoxCashManagement = new BoxCashManagementModel(nextDayData);
                await nextDayBoxCashManagement.save({ session });
                console.log(`Created next day (${moment(nextDay).format('YYYY-MM-DD')}) record with opening balance: ${safeOpeningBalance}`);
            }
        } catch (error) {
            console.error('Error updating next day opening balance:', error);
            // Don't throw error here as it shouldn't fail the main transaction
        }
    }
    async createBoxCashManagement(data: CreateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Use UTC to handle dates consistently
            const targetDate = moment.utc(data.date).startOf('day').toDate();
            const targetDateEnd = moment.utc(data.date).endOf('day').toDate();

            console.log("Target Date (start):", targetDate);
            console.log("Target Date (end):", targetDateEnd);

            // Check if record already exists for this date
            const existingRecord = await BoxCashManagementModel.findOne({
                date: {
                    $gte: targetDate,
                    $lte: targetDateEnd
                },
                isDelete: false
            }).session(session);

            console.log("Existing record found:", existingRecord);

            if (existingRecord) {
                // If record exists, UPDATE it instead of creating new one
                await this.updateExistingBoxCashManagement(String(existingRecord._id), data, userId, session);
                await session.commitTransaction();

                return successResponse(
                    'Box cash management record updated successfully',
                    StatusCodes.OK,
                    existingRecord
                );
            }

            // Calculate amounts from BoxCash transactions
            const amounts = await this.calculateAmountsFromBoxCash(targetDate);

            // Calculate opening balance from previous day
            const openingBalance = await this.calculateOpeningBalance(targetDate);

            // Calculate closing balance
            const closingBalance = this.calculateClosingBalance(
                openingBalance,
                amounts,
                data.closingAmount
            );

            console.log("Calculated amounts:", amounts);
            console.log("Opening balance:", openingBalance);
            console.log("Closing balance:", closingBalance);
            const rawDifference = data.closingAmount - closingBalance;
            const differenceAmount = Math.abs(rawDifference);
            const differenceType = rawDifference > 0 ? 'excess' : rawDifference < 0 ? 'shortage' : 'balanced';

            console.log("Actual Closing Amount:", data.closingAmount);
            console.log("Difference Amount:", differenceAmount);
            console.log("Difference Type:", differenceType);
            // Create the box cash management record
            const boxCashManagementData = {
                date: targetDate, // Use the consistent UTC date
                pettyCashOpeningAmount: amounts.pettyCashOpeningAmount,
                expenseAmount: amounts.expenseAmount,
                purchaseAmount: amounts.purchaseAmount,
                withdrawAmount: amounts.withdrawAmount,
                depositAmount: amounts.depositAmount,
                collectionAmount: amounts.collectionAmount,
                pettyCashClosingAmount: amounts.pettyCashClosingAmount,
                openingBalance: openingBalance,
                closingBalance: data.closingAmount,
                denominations: data.denominations,
                differenceType: differenceType,
                differenceAmount: differenceAmount,
                description: data.description,
                isDelete: false,
                isActive: true,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId)
            };

            const boxCashManagement = new BoxCashManagementModel(boxCashManagementData);
            await boxCashManagement.save({ session });

            // Update next day's opening balance with current day's closing balance
            await this.updateNextDayOpeningBalance(targetDate, data.closingAmount, userId, session);

            await session.commitTransaction();

            return successResponse(
                'Box cash management record created successfully',
                StatusCodes.CREATED,
                boxCashManagement
            );
        } catch (error: any) {
            await session.abortTransaction();
            console.error("Error in createBoxCashManagement:", error);
            return createErrorResponse(
                "Failed to create box cash management record",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } finally {
            session.endSession();
        }
    }

    private async updateExistingBoxCashManagement(id: string, data: UpdateBoxCashManagementInput, userId: string, session: mongoose.ClientSession) {
        const existingRecord = await BoxCashManagementModel.findById(id).session(session);

        if (!existingRecord) return;

        // Recalculate amounts
        const amounts = await this.calculateAmountsFromBoxCash(existingRecord.date);
        console.log(amounts, "aaaa2");

        // Calculate closing balance
        const closingBalance = this.calculateClosingBalance(
            existingRecord.openingBalance,
            amounts,
            Number(data.closingAmount)
        );
        console.log(closingBalance, "ccccccc2");
        const rawDifference = Number(data.closingAmount) - closingBalance;
        const differenceAmount = Math.abs(rawDifference);
        const differenceType = rawDifference > 0 ? 'excess' : rawDifference < 0 ? 'shortage' : 'balanced';

        console.log("Actual Closing Amount:", data.closingAmount);
        console.log("Difference Amount:", differenceAmount);
        console.log("Difference Type:", differenceType);
        // Update the existing record
        const updateData: any = {
            pettyCashOpeningAmount: amounts.pettyCashOpeningAmount,
            expenseAmount: amounts.expenseAmount,
            purchaseAmount: amounts.purchaseAmount,
            withdrawAmount: amounts.withdrawAmount,
            depositAmount: amounts.depositAmount,
            collectionAmount: amounts.collectionAmount,
            pettyCashClosingAmount: amounts.pettyCashClosingAmount,
            closingBalance: data.closingAmount,
            denominations: data.denominations,
            differenceType: differenceType,
            differenceAmount: differenceAmount,
            description: data.description || existingRecord.description,
            modifiedBy: new Types.ObjectId(userId),
            updatedAt: new Date()
        };
        console.log(updateData, "uuuuuuuuu3");

        await BoxCashManagementModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { session }
        );

        // Update next day's opening balance
        await this.updateNextDayOpeningBalance(existingRecord.date, Number(data.closingAmount), userId, session);
    }

    async getBoxCashManagementById(id: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse> {
        try {
            const record = await BoxCashManagementModel.findOne({
                _id: id,
                isDelete: false
            }).populate({
                path: 'createdBy',
                select: 'name'
            }).populate({
                path: 'modifiedBy',
                select: 'name'
            });

            if (!record) {
                return createErrorResponse(
                    "Box cash management record not found",
                    StatusCodes.NOT_FOUND
                );
            }

            return successResponse(
                'Box cash management record retrieved successfully',
                StatusCodes.OK,
                record
            );
        } catch (error: any) {
            return createErrorResponse(
                "Failed to fetch box cash management record",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getAllBoxCashManagement(params: BoxCashManagementParams): Promise<PaginationResult<IBoxCashManagement> | ErrorResponse> {
        try {
            const { page = 1, limit = 10, search, startDate, endDate } = params;
            const skip = (page - 1) * limit;

            const match: any = { isDelete: false };

            if (search) {
                match.$or = [
                    { description: { $regex: search, $options: 'i' } },
                ];
            }

            if (startDate && endDate) {
                match.date = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lte: moment(endDate).endOf('day').toDate(),
                };
            }

            const pipeline: any[] = [
                { $match: match },
                { $sort: { date: -1 } },
                { $skip: skip },
                { $limit: limit },
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
                // Lookup modifiedBy details
                {
                    $lookup: {
                        from: 'admins',
                        localField: 'modifiedBy',
                        foreignField: '_id',
                        as: 'modifiedBy'
                    }
                },
                {
                    $unwind: {
                        path: '$modifiedBy',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project required fields
                {
                    $project: {
                        date: 1,
                        pettyCashOpeningAmount: 1,
                        expenseAmount: 1,
                        purchaseAmount: 1,
                        withdrawAmount: 1,
                        depositAmount: 1,
                        collectionAmount: 1,
                        pettyCashClosingAmount: 1,
                        openingBalance: 1,
                        closingBalance: 1,
                        denominations: 1,
                        description: 1,
                        createdBy: {
                            _id: '$createdBy._id',
                            name: '$createdBy.name'
                        },
                        modifiedBy: {
                            _id: '$modifiedBy._id',
                            name: '$modifiedBy.name'
                        },
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ];

            const [items, total] = await Promise.all([
                BoxCashManagementModel.aggregate(pipeline),
                BoxCashManagementModel.countDocuments(match),
            ]);

            return {
                status: StatusCodes.OK,
                message: 'Box cash management records retrieved successfully',
                data: items,
                totalCount: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                from: (page - 1) * limit + 1,
                to: Math.min(page * limit, total)
            };
        } catch (error: any) {
            return createErrorResponse(
                "Failed to fetch box cash management records",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateBoxCashManagement(id: string, data: UpdateBoxCashManagementInput, userId: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const existingRecord = await BoxCashManagementModel.findById(id).session(session);

            if (!existingRecord) {
                await session.abortTransaction();
                return createErrorResponse(
                    "Box cash management record not found",
                    StatusCodes.NOT_FOUND
                );
            }

            // Recalculate amounts if date is changed
            let amounts = await this.calculateAmountsFromBoxCash(existingRecord.date);
            let openingBalance = existingRecord.openingBalance;
            let closingBalance = existingRecord.closingBalance;

            if (data.date && data.date !== existingRecord.date) {
                amounts = await this.calculateAmountsFromBoxCash(data.date);
                openingBalance = await this.calculateOpeningBalance(data.date);
            }

            // Recalculate closing balance if closing amount or other amounts changed
            const closingAmount = data.closingAmount || existingRecord.closingBalance;
            closingBalance = this.calculateClosingBalance(
                openingBalance,
                amounts,
                closingAmount
            );

            const updateData: any = {
                ...data,
                pettyCashOpeningAmount: amounts.pettyCashOpeningAmount,
                expenseAmount: amounts.expenseAmount,
                purchaseAmount: amounts.purchaseAmount,
                withdrawAmount: amounts.withdrawAmount,
                depositAmount: amounts.depositAmount,
                collectionAmount: amounts.collectionAmount,
                pettyCashClosingAmount: amounts.pettyCashClosingAmount,
                openingBalance: openingBalance,
                closingBalance: closingBalance,
                modifiedBy: new Types.ObjectId(userId)
            };

            const result = await BoxCashManagementModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, session }
            );

            if (!result) {
                await session.abortTransaction();
                return createErrorResponse(
                    "Box cash management record not found",
                    StatusCodes.NOT_FOUND
                );
            }

            await session.commitTransaction();

            return successResponse(
                'Box cash management record updated successfully',
                StatusCodes.OK,
                result
            );
        } catch (error: any) {
            await session.abortTransaction();
            return createErrorResponse(
                "Failed to update box cash management record",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } finally {
            session.endSession();
        }
    }

    async deleteBoxCashManagement(id: string): Promise<ApiResponse<null> | ErrorResponse> {
        try {
            const result = await BoxCashManagementModel.findByIdAndUpdate(
                id,
                { isDelete: true },
                { new: true }
            );

            if (!result) {
                return createErrorResponse(
                    "Box cash management record not found",
                    StatusCodes.NOT_FOUND
                );
            }

            return successResponse(
                'Box cash management record deleted successfully',
                StatusCodes.OK,
                null
            );
        } catch (error: any) {
            return createErrorResponse(
                "Failed to delete box cash management record",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async getBoxCashManagementByDate(date: string): Promise<ApiResponse<IBoxCashManagement> | ErrorResponse> {
        try {
            const targetDate = moment(date).startOf('day').toDate();

            const record = await BoxCashManagementModel.findOne({
                date: {
                    $gte: targetDate,
                    $lte: moment(targetDate).endOf('day').toDate()
                },
                isDelete: false
            }).populate({
                path: 'createdBy',
                select: 'name'
            }).populate({
                path: 'modifiedBy',
                select: 'name'
            });

            if (!record) {
                return createErrorResponse(
                    "Box cash management record not found for the specified date",
                    StatusCodes.NOT_FOUND
                );
            }

            return successResponse(
                'Box cash management record retrieved successfully',
                StatusCodes.OK,
                record
            );
        } catch (error: any) {
            return createErrorResponse(
                "Failed to fetch box cash management record",
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function boxCashManagementRepository(): IBoxCashManagementRepository {
    return new BoxCashManagementRepository();
}