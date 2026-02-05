import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CreateUserAddress } from "../../api/Request/user.address";
export interface IUserAddressRepository {
    // Password management
    findUserByEmail(
        email: string
    ): Promise<ApiResponse<any> | ErrorResponse>;
    createUserAddress(
        data: CreateUserAddress
    ): Promise<ApiResponse<any> | ErrorResponse>;
    updateUserAddress(
        id: string, data: CreateUserAddress
    ): Promise<ApiResponse<any> | ErrorResponse>;
    getAddress(userId: string,type?:string): Promise<ApiResponse<any> | ErrorResponse>;
    getAddressDetails(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    deleteAddress(id: string): Promise<ApiResponse<any> | ErrorResponse>;

}

export interface UserAddressServiceDomain {
    findUserByEmail(
        email: string
    ): Promise<ApiResponse<any> | ErrorResponse>;
    createUserAddress(
        data: CreateUserAddress
    ): Promise<ApiResponse<any> | ErrorResponse>;

    updateUserAddress(
        id: string, data: CreateUserAddress
    ): Promise<ApiResponse<any> | ErrorResponse>;
    getAddress(userId: string,type?:string): Promise<ApiResponse<any> | ErrorResponse>;
    deleteAddress(id: string): Promise<ApiResponse<any> | ErrorResponse>;
    getAddressDetails(id: string): Promise<ApiResponse<any> | ErrorResponse>;

}
