import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import { RootListParams } from "../../../domain/admin/root.Domain";
import { Types } from "mongoose";
import { createErrorResponse } from "../../../utils/common/errors";
import { RootModel } from "../../../app/model/root";
import { successResponse } from "../../../utils/common/commonResponse";

import { ShopTypeDomainRepository } from "../../../domain/admin/shop.typeDomain";
import ShopTypes from "../../../app/model/shop.type";
import { ShopTypeDocumentResponse } from "../../../api/response/shop.type";
import { CreateShopTypeInput, UpdateShopTypeInput } from "../../../api/Request/shop.type";

class ShopTypeRepository implements ShopTypeDomainRepository {

  db: any
  constructor(db: any) {
    this.db = db
  }
  async deleteShopType(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {
      const deleteRoot = await ShopTypes.findOneAndUpdate(
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
          'Shope type with given ID not found'
        );
      }

      return successResponse("Shop type deleted successfully", StatusCodes.OK, { message: "Shop type deleted successfully" });

    } catch (error: any) {
      return createErrorResponse(
        "Error in route delete",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getShopTypeList(params: RootListParams): Promise<PaginationResult<ShopTypeDocumentResponse[]> | ErrorResponse> {
    try {
      const { page, limit, search } = params;
      const pipeLine = [];

      // Add pincode filter if pincode parameter is provided
      const matchFilter: any = {
        isActive: true,
        isDelete: false
      };
      if (search) {
        matchFilter.name = { $regex: search, $options: "i" };
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
          $project: {
            _id: 1,
            name: 1,
            isDelete: 1,
            isActive: 1,
            createdByName: { $arrayElemAt: ['$createdBy.name', 0] },
            modifiedByName: { $arrayElemAt: ['$modifiedBy.name', 0] },
            createdAt: 1,
            updatedAt: 1,
          }
        }
      );

      if (limit > 0) {
        pipeLine.push(
          { $skip: page * limit },
          { $limit: limit }
        );
      }

      const [result, count] = await Promise.all([
        ShopTypes.aggregate(pipeLine),
        limit > 0 ? ShopTypes.countDocuments(matchFilter) : 0
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

  async createShopeType(input: CreateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {

      const exists = await ShopTypes.findOne({ name: input.name, isActive: true, isDelete: false });
      if (exists) {
        return createErrorResponse(
          "Shop type already exists",
          StatusCodes.BAD_REQUEST,
          "Shop type with given name already exists"
        );
      }
      const result = await ShopTypes.create({
        name: input.name,
        createdBy: new Types.ObjectId(userId),
        modifiedBy: new Types.ObjectId(userId)
      });

      if (!result) {
        return createErrorResponse(
          "Shop type creation error",
          StatusCodes.BAD_REQUEST,
          "Unable to create shope type"
        );
      }
      return successResponse("Shop type created successfully", StatusCodes.OK, { message: '' });


    } catch (error: any) {
      return createErrorResponse(
        "Error in create shope type",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async updateShoptype(input: UpdateShopTypeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
    try {

      const result = await ShopTypes.findByIdAndUpdate(input.id, {
        name: input.name,
        modifiedBy: new Types.ObjectId(userId)
      });
      if (!result) {
        return createErrorResponse(
          "Unable to find shop type",
          StatusCodes.BAD_REQUEST,
          "Unable to find shop type"
        );
      }

      return successResponse("Shop type updated successfully", StatusCodes.OK, { message: '' });


    } catch (error: any) {
      return createErrorResponse(
        "Error in update shop type",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
  async getShoptypeById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const result = await ShopTypes.findOne({
        _id: new Types.ObjectId(id),
        isActive: true,
        isDelete: false
      });

      if (!result) {
        return createErrorResponse(
          'Shop type not found',
          StatusCodes.NOT_FOUND,
          'Shop type with given ID not found'
        );
      }
      return {
        status: 'success',
        statusCode: StatusCodes.OK,
        message: 'Shop type retrieved successfully',
        data: result
      };

    } catch (error: any) {
      return createErrorResponse(
        'Error in finding shop type',
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export function RegisterNewShopTypeReposiorty(db: any): ShopTypeDomainRepository {
  return new ShopTypeRepository(db)
}