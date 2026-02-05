import { Request, Response } from "express";
// import { IUserAddressRepository } from "../../../domain/website/UserAddress.domain";
// import { CreateUserAddress, createUserAddressSchema } from "../../../api/Request/UserAddress";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { IUserAddressRepository } from "../../../domain/mobile-app/user.address";
import { CreateUserAddress, createUserAddressSchema } from "../../../api/Request/user.address";
import UserAddress from "../../model/address";
export class UserAddressHandler {
    private UserAddressRepo: IUserAddressRepository;

    constructor(UserAddressRepo: IUserAddressRepository) {
        this.UserAddressRepo = UserAddressRepo;
    }

    createUserAddress = async (req: Request, res: Response): Promise<any> => {
        try {
            // Validate input
            const parsed = createUserAddressSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "Validation failed",
                    errors: parsed.error.errors,
                });
            }
            const data: CreateUserAddress = parsed.data;

            const result = await this.UserAddressRepo.createUserAddress(data);

            return res.status(
                result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.CREATED
            ).json(result);

        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                message: err.message || "Internal server error",
            });
        }
    };

    updateUserAddress = async (req: Request, res: Response): Promise<any> => {
        try {
            const UserAddressId = req.params.id as any;

            if (!UserAddressId || !Types.ObjectId.isValid(UserAddressId)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "A valid UserAddress ID is required",
                });
            }

            const parsed = createUserAddressSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "Validation failed",
                    errors: parsed.error.errors,
                });
            }

            const userAddress = await UserAddress.findOne({ _id: UserAddressId, isActive: 1, isDelete: 0 });
            if (!userAddress) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "User address not found",
                });
            }
            const data: CreateUserAddress = parsed.data;
            const result = await this.UserAddressRepo.updateUserAddress(UserAddressId, data);

            return res.status(
                result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK
            ).json(result);

        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                message: err.message || "Internal server error",
            });
        }
    };

    getUserAddress = async (req: Request, res: Response): Promise<any> => {
        const userId = req.params.id as string || '';
        const type = req.query.type as string || '';
        console.log(type, '');

        const result = await this.UserAddressRepo.getAddress(userId, type);
        if (result.status === "error") {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
        }

        return res.status(StatusCodes.OK).json(result);
    };


    deleteUserAddress = async (req: Request, res: Response): Promise<any> => {
        try {
            const UserAddressId = req.params.id as any;

            if (!UserAddressId || !Types.ObjectId.isValid(UserAddressId)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "A valid UserAddress ID is required",
                });
            }
            const userAddress = await UserAddress.findOne({ _id: UserAddressId, isActive: 1, isDelete: 0 });
            if (!userAddress) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: "User address not found",
                });
            }
            const result = await this.UserAddressRepo.deleteAddress(UserAddressId);

            return res.status(
                result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK
            ).json(result);

        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                message: err.message || "Internal server error",
            });
        }
    };
    getUserAddressDetails = async (req: Request, res: Response): Promise<any> => {
        const userId = req.params.id as string || '';
        const result = await this.UserAddressRepo.getAddressDetails(userId);
        if (result.status === "error") {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
        }

        return res.status(StatusCodes.OK).json(result);
    };

}

export function UserAddressHandlerFun(UserAddressRepo: IUserAddressRepository): UserAddressHandler {
    return new UserAddressHandler(UserAddressRepo);
}


