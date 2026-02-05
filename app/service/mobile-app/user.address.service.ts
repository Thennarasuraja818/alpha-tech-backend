
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { UserAddressServiceDomain } from "../../../domain/mobile-app/user.address";
import { CreateUserAddress } from "../../../api/Request/user.address";
export class UserAddressService implements UserAddressServiceDomain {
    private adminRepository: UserAddressServiceDomain;

    constructor(adminRepository: UserAddressServiceDomain) {
        this.adminRepository = adminRepository;
    }
    async getAddress(userId: string, type?: string): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.getAddress(userId, type);
        if (result.status === "error") return result;
        return result;
    }

    async createUserAddress(data: CreateUserAddress): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.createUserAddress(data);
        if (result.status === "error") return result;
        return result;
    }
    async updateUserAddress(id: string, data: CreateUserAddress): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.updateUserAddress(id, data);
        if (result.status === "error") return result;
        return result;
    }
    async deleteAddress(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.deleteAddress(id);
        if (result.status === "error") return result;
        return result;
    }
    async getAddressDetails(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.getAddressDetails(id);
        if (result.status === "error") return result;
        return result;
    }
    findUserByEmail(email: string): Promise<ApiResponse<any> | ErrorResponse> {
        throw new Error("Method not implemented.");
    }

}

export function userAddressService(repo: UserAddressServiceDomain): UserAddressServiceDomain {
    return new UserAddressService(repo);
}
