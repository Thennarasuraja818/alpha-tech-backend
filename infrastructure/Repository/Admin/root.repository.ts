import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { RootDomainRepository, RootListParams } from "../../../domain/admin/root.Domain";
import { Types } from "mongoose";
import { createErrorResponse } from "../../../utils/common/errors";
import { CreateRootInput, UpdateRootInput } from "../../../api/Request/root";
import { RootModel } from "../../../app/model/root";
import { successResponse } from "../../../utils/common/commonResponse";
import { RootDocumentResponse } from "../../../api/response/root.response";
import CustomerVariants from "../../../app/model/customerVariant";
import { CreateCustomerVariant, UpdateCustomerVariantRetailer } from "../../../api/Request/customer.variant";
import Users from "../../../app/model/user";
import WholesalerRetailsers from "../../../app/model/Wholesaler";

class RootRepository implements RootDomainRepository {

  db: any
  constructor(db: any) {
    this.db = db
  }
  async deleteRoot(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const deleteRoot = await RootModel.findOneAndUpdate(
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

      if (!deleteRoot) {
        return createErrorResponse(
          'Error in route delete',
          StatusCodes.NOT_FOUND,
          'route with given ID not found'
        );
      }

      return successResponse("Route deleted successfully", StatusCodes.OK, { message: "Route deleted successfully" });

    } catch (error: any) {
      return createErrorResponse(
        "Error in route delete",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse> {
    try {
      const { page, limit, pincode, search } = params;
      const pipeLine = [];
      const countFilter: any = {
        isActive: true,
        isDelete: false,
      };

      // Add pincode filter if pincode parameter is provided
      const matchFilter: any = {
        isActive: true,
        isDelete: false
      };

      if (pincode) {
        matchFilter['pincode.code'] = pincode;
        countFilter['pincode.code'] = pincode;
      }

      // Handle search functionality
      if (search && search.trim() !== '') {
        // First lookup salesman and deliveryman details to enable searching by their names
        pipeLine.push(
          {
            $lookup: {
              from: 'adminusers',
              localField: 'salesman',
              foreignField: '_id',
              as: 'salesmanDtls'
            }
          },
          {
            $lookup: {
              from: 'adminusers',
              localField: 'deliveryman',
              foreignField: '_id',
              as: 'deliverymanDtls'
            }
          },
          {
            $lookup: {
              from: 'adminusers',
              localField: 'crmUser',
              foreignField: '_id',
              as: 'crmUserDtls'
            }
          },
          {
            $addFields: {
              salesmanName: { $arrayElemAt: ['$salesmanDtls.name', 0] },
              deliverymanName: { $arrayElemAt: ['$deliverymanDtls.name', 0] },
              crmUserName: { $arrayElemAt: ['$crmUserDtls.name', 0] },
              pincodeStrings: {
                $map: {
                  input: "$pincode",
                  as: "pin",
                  in: "$$pin.code"
                }
              }
            }
          },
          {
            $match: {
              $or: [
                { rootName: { $regex: search, $options: 'i' } },
                { salesmanName: { $regex: search, $options: 'i' } },
                { deliverymanName: { $regex: search, $options: 'i' } },
                { pincodeStrings: { $in: [new RegExp(search, 'i')] } }
              ]
            }
          }
        );
      }

      pipeLine.push(
        {
          $match: matchFilter
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'modifiedBy',
            foreignField: '_id',
            as: 'modifiedBy'
          }
        },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'salesman',
            foreignField: '_id',
            as: 'salesmanDtls'
          }
        },
        {
          $lookup: {
            from: 'attributes',
            localField: 'variants.attributeId',
            foreignField: '_id',
            as: 'attributes'
          }
        },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'deliveryman',
            foreignField: '_id',
            as: 'deliverymanDtls'
          }
        },
        {
          $lookup: {
            from: 'adminusers',
            localField: 'crmUser',
            foreignField: '_id',
            as: 'crmUserDtls'
          }
        },
        {
          $project: {
            _id: 1,
            rootName: 1,
            pincode: {
              $filter: {
                input: "$pincode",
                as: "pin",
                cond: pincode ? { $eq: ["$$pin.code", pincode] } : { $ne: ["$$pin.code", null] }
              }
            },
            deliveryCharge: 1,
            salesman: { $arrayElemAt: ['$salesmanDtls.name', 0] },
            deliveryman: { $arrayElemAt: ['$deliverymanDtls.name', 0] },
            crmUser: { $arrayElemAt: ['$crmUserDtls.name', 0] },
            isDelete: 1,
            isActive: 1,
            createdBy: { $arrayElemAt: ['$createdBy.name', 0] },
            modifiedBy: { $arrayElemAt: ['$modifiedBy.name', 0] },
            createdAt: 1,
            updatedAt: 1,
            variants: 1,
            attributes: 1
          }
        }
      );
      if (pincode) {
        pipeLine.push({
          $match: {
            pincode: { $ne: [] }
          }
        });
      }

      if (limit > 0) {
        pipeLine.push(
          { $skip: page * limit },
          { $limit: limit }
        );
      }

      const [result, count] = await Promise.all([
        RootModel.aggregate(pipeLine),
        limit > 0 ? RootModel.countDocuments(countFilter) : 0
      ]);

      return Pagination(count, result, limit, page);

    } catch (error: any) {
      return createErrorResponse(
        "Error in list route",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async findRootIsExist(id: string): Promise<Boolean | ErrorResponse> {
    try {
      const countRoot = await RootModel.countDocuments({
        _id: new Types.ObjectId(id)
      })
      console.log("enter in find route");

      console.log(id, "_id");

      return countRoot > 0
    } catch (error: any) {
      return createErrorResponse(
        "Error in find route",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async createRoute(input: CreateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const inputs = {
        rootName: input.rootName,
        pincode: input.pincode.map((code) => { return { code: code } }),
        salesman: input.salesman,
        deliveryCharge: input.deliveryCharge,
        crmUser: input.crmUser,
        deliveryman: input.deliveryman,
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        variants: input.variants,
      }
      const exists = await RootModel.findOne({ rootName: input.rootName, isActive: true, isDelete: false });
      if (exists) {
        return createErrorResponse(
          "Route already exists",
          StatusCodes.CONFLICT,
          "Route with given name already exists"
        );
      }
      const existingPincode = await RootModel.findOne({
        isActive: true,
        isDelete: false,
        "pincode.code": { $in: input.pincode },
      });

      if (existingPincode) {
        return createErrorResponse(
          "Pincode already assigned",
          StatusCodes.CONFLICT,
          `Pincodes already assigned to route: ${existingPincode.rootName}`
        );
      }
      await RootModel.create(inputs)

      return successResponse("Route created successfully", StatusCodes.OK, { message: '' });


    } catch (error: any) {
      return createErrorResponse(
        "Error in create route",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async updateRoue(input: UpdateRootInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const inputs = {
        rootName: input.rootName,
        pincode: input.pincode.map((code) => { return { code: code } }),
        salesman: input.salesman,
        crmUser: input.crmUser,
        deliveryCharge: input.deliveryCharge,
        deliveryman: input.deliveryman,
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId),
        variants: input.variants,

      }

      await RootModel.updateOne(
        { _id: new Types.ObjectId(input.id) },
        { $set: inputs }
      );

      return successResponse("Route update successfully", StatusCodes.OK, { message: '' });


    } catch (error: any) {
      return createErrorResponse(
        "Error in update route",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async getRouteById(id: string): Promise<ApiResponse<RootDocumentResponse> | ErrorResponse> {
    try {
      const result = await RootModel.findOne({
        _id: new Types.ObjectId(id),
        isActive: true,
        isDelete: false
      });

      if (!result) {
        return createErrorResponse(
          'Route not found',
          StatusCodes.NOT_FOUND,
          'Route with given ID not found'
        );
      }

      const response: RootDocumentResponse = {
        _id: result._id.toString(),
        rootName: result.rootName.toString(),
        pincode: result.pincode.map(p => ({
          code: p.code ?? ''
        })),
        salesman: result.salesman.toString(),
        deliveryCharge: result.deliveryCharge,
        deliveryman: result.deliveryman.toString(),
        crmUser: result.crmUser?.toString() ?? '',
        isDelete: result.isDelete,
        isActive: result.isActive,
        createdBy: result.createdBy.toString(),
        modifiedBy: result.modifiedBy.toString(),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        variants: result.variants
      };

      return {
        status: 'success',
        statusCode: StatusCodes.OK,
        message: 'Route retrieved successfully',
        data: response
      };

    } catch (error: any) {
      return createErrorResponse(
        'Error in finding route',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async createCustomerVariant(input: CreateCustomerVariant, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {

      const exists = await CustomerVariants.findOne({ name: input.name })
      if (exists) {
        return createErrorResponse(
          "Customer varaint already exists",
          StatusCodes.CONFLICT,
          "Customer varaint with given name already exists"
        );
      }
      await CustomerVariants.create(input)

      return successResponse("Customer varaint created successfully", StatusCodes.OK, { message: '' });


    } catch (error: any) {
      return createErrorResponse(
        "Error in create route",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async customerVariantList(params: any) {
    try {
      const result = await CustomerVariants.find({ isActive: true, isDelete: false });

      return successResponse("Customer variant listed successfully", StatusCodes.OK, { message: 'Customer variant listed successfully', data: result });

    } catch (e: any) {
      return createErrorResponse(
        'Error in finding route',
        StatusCodes.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
  }
  async updateCustomerVariantForCustomer(
    input: UpdateCustomerVariantRetailer,
    userId: string
  ): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const isUser = input.userType === 'user';
      const Model: any = isUser ? Users : WholesalerRetailsers;

      const user = await Model.findOne({
        _id: new Types.ObjectId(input.id),
        isActive: true,
        isDelete: false,
      });

      if (!user) {
        return createErrorResponse("User not found", StatusCodes.CONFLICT, "User not found");
      }

      await Model.updateOne(
        { _id: user._id },
        { customerVariant: input.variantId, modifiedBy: new Types.ObjectId(userId) }
      );

      return successResponse(
        "Customer variant updated successfully",
        StatusCodes.OK,
        { message: "Customer variant updated successfully" }
      );

    } catch (error: any) {
      return createErrorResponse(
        "Error updating customer variant",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }


}

export function RegisterNewRootReposiorty(db: any): RootDomainRepository {
  return new RootRepository(db)
}