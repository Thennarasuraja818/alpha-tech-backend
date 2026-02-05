import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { DashboardDomainRepository } from "../../../domain/admin/dashboard.domain";
import Users from "../../../app/model/user";
import { ApiResponse } from "../../../api/response/commonResponse";
import Pagination from "../../../api/response/paginationResponse";
import moment from "moment";
import { OrderModel } from "../../../app/model/order";

export class DashboardRepository implements DashboardDomainRepository {
  constructor(private db: any) { }

  async getRecentCustomer(): Promise<ApiResponse<any[]> | ErrorResponse> {
    try {
      const page = 0;
      const limit = 5;
      const count = await Users.countDocuments({
        isDelete: false,
        isActive: true
      });

      const results = await Users.aggregate([
        {
          $match: {
            isDelete: false,
            isActive: true
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: page * limit },
        { $limit: limit }
      ]);

      return Pagination(count, results, limit, page);
    } catch (e: any) {
      console.error('Error in getRecentCustomer:', e);
      return createErrorResponse('Error fetching recent customers', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }

  async topSellingProduct(params: any): Promise<ApiResponse<any[]> | ErrorResponse> {
    try {
      let { dateFilter, page, limit } = params;
      page = page || 0;
      limit = limit || 5;
      const now = moment();

      let currentStart: Date, currentEnd: Date;

      switch (dateFilter) {
        case 'Today':
          currentStart = now.clone().startOf('day').toDate();
          currentEnd = now.clone().endOf('day').toDate();
          break;
        case 'Weekly':
          currentStart = now.clone().startOf('week').toDate();
          currentEnd = now.clone().endOf('week').toDate();
          break;
        case 'Monthly':
          currentStart = now.clone().startOf('month').toDate();
          currentEnd = now.clone().endOf('month').toDate();
          break;
        case 'Yearly':
          currentStart = now.clone().startOf('year').toDate();
          currentEnd = now.clone().endOf('year').toDate();
          break;
        default:
          currentStart = now.clone().startOf('month').toDate();
          currentEnd = now.clone().endOf('month').toDate();
          break;
      }
      const count = await OrderModel.countDocuments({
        isDelete: false,
        isActive: true,
        createdAt: { $gte: currentStart, $lte: currentEnd }
      });

      const results = await OrderModel.aggregate([
        {
          $match: {
            isDelete: false,
            isActive: true,
            createdAt: { $gte: currentStart, $lte: currentEnd }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            totalQuantitySold: {
              $sum: '$items.quantity'
            },
            totalPriceSold: {
              $sum: {
                $multiply: [
                  '$items.unitPrice',
                  '$items.quantity'
                ]
              }
            },
            unitPrice: { $first: '$items.unitPrice' }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $project: {
            productName:
              '$productDetails.productName',
            price: '$unitPrice',
            totalQuantitySold: 1,
            totalPriceSold: 1,
            productImage:
              '$productDetails.productImage'
          }
        },
        { $sort: { totalQuantitySold: -1 } },
        { $skip: page * limit },
        { $limit: limit }
      ]);

      return Pagination(count, results, limit, page);
    } catch (e: any) {
      console.error('Error in topSellingProduct:', e);
      return createErrorResponse('Error fetching top selling products', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
    }
  }
  async getSalesOverview(params: any): Promise<ApiResponse<any[]> | ErrorResponse> {
    const { userId, } = params;

    const salesOverview = await OrderModel.aggregate([
      {
        $match: {
          isDelete: false,
          isActive: true,
          createdAt: {
            $gte: moment().clone().startOf('year').toDate(),
            $lte: moment().clone().endOf('year').toDate()
          }
        }
      },
      {
        $addFields: {
          month: { $month: '$createdAt' },
          totalAmountWithDelivery: {
            $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }]
          }
        }
      },
      {
        $group: {
          _id: '$month',
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$totalAmountWithDelivery' },
          uniqueCustomers: { $addToSet: '$placedBy' }
        }
      },
      {
        $project: {
          _id: 0,
          monthNumber: '$_id',
          totalOrders: 1,
          totalSalesAmount: 1,
          totalCustomers: { $size: '$uniqueCustomers' }
        }
      },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$monthNumber'
            ]
          }
        }
      },
      { $sort: { monthNumber: 1 } }
    ]);

    // return successResponse('Sales Overview', 200, salesOverview);
    return {
      status: 'success',
      statusCode: StatusCodes.OK,
      message: 'Sales Overview',
      data: salesOverview
    };
  }
  async getSalesOverviewByMonth(params: any) {
    const { filterType, startDate, endDate } = params;
    const now = moment();

    // Determine current and previous period ranges
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

    switch (filterType) {
      case 'Today':
        currentStart = now.clone().startOf('day').toDate();
        currentEnd = now.clone().endOf('day').toDate();
        prevStart = now.clone().subtract(1, 'day').startOf('day').toDate();
        prevEnd = now.clone().subtract(1, 'day').endOf('day').toDate();
        break;
      case 'Weekly':
        currentStart = now.clone().startOf('week').toDate();
        currentEnd = now.clone().endOf('week').toDate();
        prevStart = now.clone().subtract(1, 'week').startOf('week').toDate();
        prevEnd = now.clone().subtract(1, 'week').endOf('week').toDate();
        break;
      case 'Monthly':
        currentStart = now.clone().startOf('month').toDate();
        currentEnd = now.clone().endOf('month').toDate();
        prevStart = now.clone().subtract(1, 'month').startOf('month').toDate();
        prevEnd = now.clone().subtract(1, 'month').endOf('month').toDate();
        break;
      case 'Yearly':
        currentStart = now.clone().startOf('year').toDate();
        currentEnd = now.clone().endOf('year').toDate();
        prevStart = now.clone().subtract(1, 'year').startOf('year').toDate();
        prevEnd = now.clone().subtract(1, 'year').endOf('year').toDate();
        break;
      case 'Custom':
        currentStart = startDate ? new Date(startDate) : now.clone().startOf('month').toDate();
        currentEnd = endDate ? new Date(endDate) : now.clone().endOf('month').toDate();

        const diffDays = moment(currentEnd).diff(moment(currentStart), 'days') + 1;
        prevStart = moment(currentStart).subtract(diffDays, 'days').toDate();
        prevEnd = moment(currentStart).subtract(1, 'day').endOf('day').toDate();
        break;
      default:
        currentStart = now.clone().startOf('month').toDate();
        currentEnd = now.clone().endOf('month').toDate();
        prevStart = now.clone().subtract(1, 'month').startOf('month').toDate();
        prevEnd = now.clone().subtract(1, 'month').endOf('month').toDate();
        break;
    }

    const getOverview = async (start: Date, end: Date) => {
      return await OrderModel.aggregate([
        {
          $match: {
            isDelete: false,
            isActive: true,
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $unwind: '$items' }, // Required to access quantity from items array
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: { $add: ['$totalAmount', { $ifNull: ['$deliveryCharge', 0] }] },
            },
            totalOrders: { $addToSet: '$_id' }, // For unique order count
            totalProductsSold: { $sum: '$items.quantity' },
            newCustomers: { $addToSet: '$placedBy' },
          },
        },
        {
          $project: {
            _id: 0,
            totalSales: 1,
            totalOrders: { $size: '$totalOrders' }, // count of distinct orders
            totalProductsSold: 1,
            newCustomers: { $size: '$newCustomers' },
          },
        },
      ]);

    };

    const [currentData] = await getOverview(currentStart, currentEnd);
    const [previousData] = await getOverview(prevStart, prevEnd);

    const formatData = (current: number = 0, previous: number = 0) => {
      const change = previous && previous !== 0 ? +(((current - previous) / previous) * 100).toFixed(2) : 0;
      return { value: current, percentage: change };
    };

    const result = {
      totalSales: formatData(currentData?.totalSales, previousData?.totalSales),
      totalOrders: formatData(currentData?.totalOrders, previousData?.totalOrders),
      totalProductsSold: formatData(currentData?.totalProductsSold, previousData?.totalProductsSold),
      newCustomers: formatData(currentData?.newCustomers, previousData?.newCustomers)
    };

    // return successResponse('Sales Overview Summary', 200, result);
    return {
      status: 'success' as const, // ← fixes the type mismatch
      statusCode: StatusCodes.OK,
      message: 'Sales Overview Summary',
      data: result
    };

  }

  async getPaidOrdersList(params: any) {
    const { startDate, endDate } = params;

    const matchStage: any = {
      isDelete: false,
      isActive: true,
      paymentStatus: 'paid'
    };

    // Optional date filtering
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await OrderModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'wholesalerretailers', // or 'users' if needed
          localField: 'placedBy',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          orderId: { $concat: ['#', { $toString: '$orderCode' }] },
          customerName: '$customer.name',
          customerImage: '$customer.profileImage',
          paymentStatus: 'Paid', // already filtered, static here
          date: {
            $dateToString: { format: '%d %b', date: '$createdAt' }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return {
      status: 'success' as const,
      statusCode: 200,
      message: 'Paid Orders List',
      data: orders
    };
  }

}

export function NewDashboardRepository(db: any): DashboardDomainRepository {
  return new DashboardRepository(db);
}