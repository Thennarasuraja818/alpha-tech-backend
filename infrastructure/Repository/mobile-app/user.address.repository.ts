import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { IUserAddressRepository } from "../../../domain/mobile-app/user.address";
import { CreateUserAddress } from "../../../api/Request/user.address";
import UserAddress from "../../../app/model/address";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
import Users from "../../../app/model/user";

export class UserAddressRepository implements IUserAddressRepository {
    private db: any;

    constructor(db: any) {
        this.db = db;
    }

    findUserByEmail(email: string): Promise<ApiResponse<any> | ErrorResponse> {
        throw new Error("Method not implemented.");
    }
    async createUserAddress(data: CreateUserAddress): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const result = await UserAddress.create(data);
            if (!result) {
                return createErrorResponse('Create error', StatusCodes.NOT_FOUND, 'Unable to create address');
            }
            await Users.findByIdAndUpdate(data.userId, {
                $set: {
                    pincode: data.postalCode
                }
            })
            return successResponse('Address created', StatusCodes.CREATED, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async updateUserAddress(id: string, data: CreateUserAddress): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const result = await UserAddress.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true } // this returns the updated document
            );

            if (!result) {
                return createErrorResponse('Create error', StatusCodes.NOT_FOUND, 'Unable to update address');
            }
            return successResponse('Address updated', StatusCodes.CREATED, { message: '', data: result });
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async getAddress(userId: string, type?: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            let result;
            if (type === 'customer') {
                console.log(type, 'aaaaaaa');

                result = await UserAddress.find({ userId: new Types.ObjectId(userId), isActive: 1, isDelete: 0 });

            } else {
                result = await WholesalerRetailsers.find({ _id: new Types.ObjectId(userId), isActive: 1, isDelete: 0 });

            }

            return successResponse('Address listed', StatusCodes.CREATED, result);
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async deleteAddress(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const result = await UserAddress.findByIdAndUpdate(id, { isDelete: 1 });

            return successResponse('Address deleted', StatusCodes.CREATED, result);
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async getAddressDetails(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        try {
            const result = await UserAddress.findOne({ _id: new Types.ObjectId(id), isActive: 1, isDelete: 0 });

            return successResponse('Address updated', StatusCodes.CREATED, result);
        } catch (e: any) {
            return createErrorResponse('Create error', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
}

export function userAddressRepository(db: any): IUserAddressRepository {
    return new UserAddressRepository(db);
}
