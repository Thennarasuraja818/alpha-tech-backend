import { StatusCodes } from 'http-status-codes';
import { ErrorResponse } from '../../../api/response/cmmonerror';
import { ApiResponse, SuccessMessage } from '../../../api/response/commonResponse';
import {
  CreateSalesTargetInput,
  SalesTargetDomainRepository,
  SalesTargetListParams,
  UpdateSalesTargetInput
} from '../../../domain/admin/salesAndTargetsDomain';
import { Types } from 'mongoose';
import { createErrorResponse } from '../../../utils/common/errors';

import { successResponse } from '../../../utils/common/commonResponse';
import { SalesTargetResponse, toSalesTargetResponse } from '../../../api/response/salesAndTargets.response';
import Pagination, { PaginationResult } from '../../../api/response/paginationResponse';
import { SalesandTargets } from '../../../app/model/salesandtargets';
import AdminUsers from '../../../app/model/admin.user';
import { CashSettlementModel } from '../../../app/model/CashSettlement';
import moment from 'moment';
import { UpdateCashsettlementtInput } from '../../../api/Request/salesAndTargets';
import WholesalerRetailsers from '../../../app/model/Wholesaler';
export class SalesTargetRepository implements SalesTargetDomainRepository {
  constructor(private db: any) { }

  async findSalesTargetExists(id: string): Promise<boolean> {
    try {
      const count = await SalesandTargets.countDocuments({ _id: new Types.ObjectId(id) });
      return count > 0;
    } catch (error: any) {
      console.error('Error checking sales target existence:', error);
      return false; // or throw the error if you want it to propagate
    }
  }

  async createSalesTarget(
    input: CreateSalesTargetInput,
    userId: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const salesTargetData = {
        ...input,
        salemanId: new Types.ObjectId(input.salemanId),
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        isActive: true,
        isDelete: false,
      };

      await SalesandTargets.create(salesTargetData);

      return successResponse(
        'Sales target created successfully',
        StatusCodes.CREATED,
        { message: '' }
      );
    } catch (error: any) {
      return createErrorResponse(
        'Error creating sales target',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateSalesTarget(
    id: string,
    input: UpdateSalesTargetInput,
    userId: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const updateData: any = { ...input, modifiedBy: new Types.ObjectId(userId) };

      if (input.salemanId) {
        updateData.salemanId = new Types.ObjectId(input.salemanId);
      }

      await SalesandTargets.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updateData },
        { new: true }
      );

      return successResponse(
        'Sales target updated successfully',
        StatusCodes.OK,
        { message: '' }
      );
    } catch (error: any) {
      return createErrorResponse(
        'Error updating sales target',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getSalesTargetById(id: string): Promise<ApiResponse<SalesTargetResponse> | ErrorResponse> {
    try {
      const salesTarget = await SalesandTargets.aggregate([
        { $match: { _id: new Types.ObjectId(id), isDelete: false } },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'salemanId',
            foreignField: '_id',
            as: 'salesman'
          }
        },
        { $unwind: '$salesman' },
        {
          $project: {
            'salesman.password': 0,
            'salesman.__v': 0,
            'salesman.isDelete': 0,
            'salesman.isActive': 0,
          }
        }
      ]).exec();

      if (!salesTarget || salesTarget.length === 0) {
        return createErrorResponse(
          'Sales target not found',
          StatusCodes.NOT_FOUND,
          'The requested sales target does not exist or has been deleted'
        );
      }

      return successResponse(
        'Sales target retrieved successfully',
        StatusCodes.OK,
        toSalesTargetResponse(salesTarget[0])
      );
    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving sales target',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async deleteSalesTarget(
    id: string,
    userId: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      await SalesandTargets.findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          $set: {
            isDelete: true,
            modifiedBy: new Types.ObjectId(userId),
          },
        },
        { new: true }
      );

      return successResponse(
        'Sales target deleted successfully',
        StatusCodes.OK,
        { message: '' }
      );
    } catch (error: any) {
      return createErrorResponse(
        'Error deleting sales target',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async salesPerformanceList(params: SalesTargetListParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      const { page, limit, search, status, targetPeriod, salemanId } = params;

      console.log(page * limit, page, limit);

      const matchQuery: any = { isDelete: false };

      if (status) matchQuery.status = status;
      if (targetPeriod) matchQuery.targetPeriod = targetPeriod;
      if (search) {
        matchQuery.$or = [
          { status: { $regex: search, $options: 'i' } },
          { targetPeriod: { $regex: search, $options: 'i' } }
        ];
      }

      const [total, items] = await Promise.all([
        SalesandTargets.countDocuments(matchQuery),
        SalesandTargets.aggregate([
          { $match: matchQuery },

          {
            $lookup: {
              from: 'adminusers',
              localField: 'salemanId',
              foreignField: '_id',
              as: 'salesman'
            }
          },
          { $unwind: '$salesman' },

          {
            $lookup: {
              from: 'orders',
              localField: 'salemanId',
              foreignField: 'createdBy',
              as: 'orders'
            }
          },
          {
            $unwind: {
              path: "$orders",
              preserveNullAndEmptyArrays: true
            }
          },

          {
            $lookup: {
              from: 'wholesalerretailers',
              localField: 'salemanId',
              foreignField: 'createdBy',
              as: 'clients'
            }
          },
          {
            $group: {
              _id: '$salemanId',
              salesman: { $first: '$salesman' },
              totalOrdersManaged: { $sum: 1 }, // 1 per order after unwind
              totalSalesValue: { $sum: '$orders.totalAmount' },
              lastOrderDate: { $max: '$orders.createdAt' },
              // these still work as-is
              newClientsAdded: { $sum: { $size: '$clients' } },
              salesTargetAchieved: { $first: '$status' },
              incentivePercentage: { $first: '$incentiveAmount' }
            }
          },

          {
            $addFields: {
              incentivesEarned: {
                $round: [
                  { $divide: [{ $multiply: ['$totalSalesValue', '$incentivePercentage'] }, 100] },
                  2
                ]
              },
              performanceRating: {
                $cond: [
                  { $gte: ['$salesTargetAchieved', '80%'] },
                  'Good',
                  {
                    $cond: [
                      { $gte: ['$salesTargetAchieved', '60%'] },
                      'Average',
                      'Poor'
                    ]
                  }
                ]
              }
            }
          },

          { $sort: { lastOrderDate: -1 } },
          { $skip: page * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              salemanId: '$_id',
              salesmanName: '$salesman.name',
              totalOrdersManaged: 1,
              totalSalesValue: 1,
              newClientsAdded: 1,
              lastOrderDate: 1,
              salesTargetAchieved: 1,
              incentivesEarned: 1,
              performanceRating: 1
            }
          }
        ])
      ]);

      return Pagination(total, items, limit, page);

    } catch (error: any) {
      return createErrorResponse(
        'Error retrieving sales performance data',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async listSalesTargets(params: SalesTargetListParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      const { page, limit, search } = params;
      console.log(page, 'page', limit);

      const matchQuery: any = {
        isDelete: false,
      };

      if (search) {
        matchQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const [total, salesmen] = await Promise.all([
        AdminUsers.countDocuments(matchQuery),
        AdminUsers.aggregate([
          { $match: matchQuery },
          {
            $lookup: {
              from: "userroles",
              localField: "roleId",
              foreignField: "_id",
              as: "roles"
            }
          },
          { $unwind: "$roles" },
          { $match: { "roles.roleName": "Salesman" } },
          // {
          //   $lookup: {
          //     from: 'wholesalerretailers',
          //     localField: '_id',
          //     foreignField: 'assignedTo',
          //     as: 'clients'
          //   }
          // },
          {
            $lookup: {
              from: 'orders',
              localField: '_id',
              foreignField: 'createdBy',
              as: 'orders'
            }
          },
          {
            $lookup: {
              from: 'salesandtargets',
              localField: '_id',
              foreignField: 'salemanId',
              as: 'targets'
            }
          },
          {
            $addFields: {
              totalOrders: { $size: '$orders' },
              totalSalesAmount: { $sum: '$orders.totalAmount' },
              salesTargetAchieved: {
                $sum: {
                  $map: {
                    input: '$targets',
                    as: 't',
                    in: '$$t.targetSalesAmount'
                  }
                }
              },
              incentivesEarned: {
                $sum: {
                  $map: {
                    input: '$targets',
                    as: 't',
                    in: {
                      $round: [
                        { $divide: [{ $multiply: ['$$t.targetSalesAmount', '$$t.incentiveAmount'] }, 100] },
                        2
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phoneNumber: 1,
              // assignedWholesalers: 1,
              // assignedRetailers: 1,
              totalOrders: 1,
              totalSalesAmount: 1,
              salesTargetAchieved: 1,
              incentivesEarned: 1,
              userId: 1,
              accountStatus: {
                $cond: [{ $eq: ['$isActive', true] }, 'Active', 'Inactive']
              }
            }
          },
          { $sort: { createdAt: 1 } },
          { $skip: page * limit },
          { $limit: limit }
        ])
      ]);

      return Pagination(total, salesmen, limit, page);
    } catch (error: any) {
      return createErrorResponse('Failed to fetch salesman overview', 500, error.message);
    }
  }
  async getCashSettlementList(params: any) {
    try {
      const { status, startDate, filterType, endDate, userId, limit, page } = params;
      const skip = limit * page;
      const match: any = {
        isDelete: false
      };

      // Optional status filter
      if (status && status !== 'All') {
        match.status = status;
      }

      // Optional date range filter
      if (startDate && endDate) {
        match.settlementDate = {
          $gte: moment(startDate, "YYYY-MM-DD").startOf("day").toDate(),
          $lte: moment(endDate, "YYYY-MM-DD").endOf("day").toDate()
        };
      }
      // Date filter
      let dateFilter: any = {};
      const now = moment();
      if (filterType === 'today') {
        dateFilter = { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() };
      } else if (filterType === 'yesterday') {
        dateFilter = {
          $gte: moment().subtract(1, 'day').startOf('day').toDate(),
          $lte: moment().subtract(1, 'day').endOf('day').toDate(),
        };
      } else if (filterType === 'thisWeek') {
        dateFilter = { $gte: now.startOf('week').toDate(), $lte: now.endOf('week').toDate() };
      } else if (filterType === 'thisMonth') {
        dateFilter = { $gte: now.startOf('month').toDate(), $lte: now.endOf('month').toDate() };
      }
      if (dateFilter && Object.keys(dateFilter).length > 0) {
        match.settlementDate = dateFilter;
      }
      const operation: any = [];

      operation.push(
        { $match: match },
        {
          $lookup: {
            from: "adminusers",
            localField: "handoverTo",
            foreignField: "_id",
            as: "handoverTo"
          }
        },
        {
          $lookup: {
            from: "paymentreceives",
            localField: "_id",
            foreignField: "settlementId",
            as: "paymentreceives"
          }
        },
        { $unwind: '$paymentreceives' },
        {
          $lookup: {
            from: "orders",
            localField: "paymentreceives.orderId",
            foreignField: "_id",
            as: "orders"
          }
        },
        {
          $addFields: {
            "paymentreceives.orderCode": {
              $arrayElemAt: ["$orders.orderCode", 0]
            }
          }
        },
        {
          $group: {
            _id: "$_id",
            cashToBeSettled: { $first: "$cashToBeSettled" },
            settlementMode: { $first: "$settlementMode" },
            settlementDate: { $first: "$settlementDate" },
            notes: { $first: "$notes" },
            isDelete: { $first: "$isDelete" },
            createdBy: { $first: "$createdBy" },
            modifiedBy: { $first: "$modifiedBy" },
            status: { $first: "$status" },
            handoverTo: { $first: "$handoverTo" },
            settledBy: { $first: "$settledBy" },
            paymentreceives: { $push: "$paymentreceives" }
          }
        },

        {
          $lookup: {
            from: "adminusers",
            localField: "settledBy",
            foreignField: "_id",
            as: "settledBy"
          }
        },
        {
          $project: {
            _id: 1,
            cashToBeSettled: 1,
            settlementMode: 1,
            settlementDate: 1,
            notes: 1,
            isDelete: 1,
            createdBy: 1,
            modifiedBy: 1,
            status: 1,
            paymentreceives: 1,
            handOverName: { $arrayElemAt: ['$handoverTo.name', 0] },
            handOverEmail: { $arrayElemAt: ['$handoverTo.email', 0] },
            settledByName: { $arrayElemAt: ['$settledBy.name', 0] },
            settledByEmail: { $arrayElemAt: ['$settledBy.email', 0] }
          }
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      );

      const count = await CashSettlementModel.countDocuments(match)
      const settlements = await CashSettlementModel.aggregate(operation);
      return Pagination(count, settlements, limit, page);

    } catch (err: any) {
      return createErrorResponse(
        'Error creating',
        StatusCodes.INTERNAL_SERVER_ERROR,
        err.message
      );
    }
  }

  async updateCashsettlementStatus(
    id: string,
    input: UpdateCashsettlementtInput,
    userId: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {

      const updateData: any = { ...input, modifiedBy: new Types.ObjectId(userId) };

      const updated = await CashSettlementModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updateData },
        { new: true }
      );
      if (!updated) {
        return createErrorResponse(
          'Error updating sales target',
          StatusCodes.BAD_REQUEST,
          'Error updating sales target'
        );
      }
      return successResponse(
        'Sales target updated successfully',
        StatusCodes.OK,
        { message: '' }
      );
    } catch (error: any) {
      return createErrorResponse(
        'Error updating sales target',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async listAchievedSalesTargets(params: SalesTargetListParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      const { page, limit, search } = params;

      const matchQuery: any = {
        isDelete: false,
        status: "Achieved"
      };

      const pipeline: any[] = [
        { $match: matchQuery },
        {
          $lookup: {
            from: "adminusers",
            localField: "salemanId",
            foreignField: "_id",
            as: "salemanInfo"
          }
        },
        { $unwind: "$salemanInfo" }
      ];

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { "salemanInfo.name": { $regex: search, $options: "i" } },
              { targetPeriod: { $regex: search, $options: "i" } }
            ]
          }
        });
      }

      pipeline.push(
        {
          $project: {
            _id: 0,
            salemanId: "$salemanInfo._id",
            salemanName: "$salemanInfo.name",
            targetSalesAmount: 1,
            incentiveAmount: 1,
            targetPeriod: 1,
            salesTargetAchieved: "$status"
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: page * limit },
        { $limit: limit }
      );

      const countPipeline: any[] = [
        { $match: matchQuery },
        {
          $lookup: {
            from: "adminusers",
            localField: "salemanId",
            foreignField: "_id",
            as: "salemanInfo"
          }
        },
        { $unwind: "$salemanInfo" }
      ];

      if (search) {
        countPipeline.push({
          $match: {
            $or: [
              { "salemanInfo.name": { $regex: search, $options: "i" } },
              { targetPeriod: { $regex: search, $options: "i" } }
            ]
          }
        });
      }

      countPipeline.push({ $count: "count" });

      const [total, salesmen] = await Promise.all([
        SalesandTargets.aggregate(countPipeline).then(res => res[0]?.count || 0),
        SalesandTargets.aggregate(pipeline)
      ]);

      return Pagination(total, salesmen, limit, page);
    } catch (error: any) {
      return createErrorResponse('Failed to fetch salesman overview', 500, error.message);
    }
  }
  async listNewAddedWholeSalerRetailer(params: SalesTargetListParams): Promise<PaginationResult<any> | ErrorResponse> {
    try {
      const { page, limit, search } = params;

      const matchQuery: any = {
        isDelete: false,
      };

      if (search) {
        matchQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { customerType: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const [total, salesmen] = await Promise.all([
        WholesalerRetailsers.countDocuments(matchQuery),
        WholesalerRetailsers.aggregate([
          {
            $match: matchQuery
          },
          {
            $sort: { createdAt: -1 }
          },
          {
            $skip: page * limit
          },
          {
            $limit: limit
          },
          {
            $lookup: {
              from: "adminusers",
              localField: "createdBy",
              foreignField: "_id",
              as: "salesman"
            }
          },
          {
            $unwind: "$salesman"
          },
          {
            $project: {
              _id: 0,
              clientId: "$_id",
              clientName: "$name",
              clientMobileNumber: "$mobileNumber",
              clientType: "$customerType",
              clientCreatedAt: "$createdAt",
              salesmanId: "$createdBy",
              salesmanName: "$salesman.name",
              salesmanEmail: "$salesman.email"
            }
          }
        ])
      ]);

      return Pagination(total, salesmen, limit, page);
    } catch (error: any) {
      return createErrorResponse('Failed to fetch salesman overview', 500, error.message);
    }
  }
}

export const NewSalesTargetRepository = (db: any): SalesTargetDomainRepository => {
  return new SalesTargetRepository(db);
};
