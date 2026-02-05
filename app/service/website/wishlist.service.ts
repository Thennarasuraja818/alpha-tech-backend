import { WishlistServiceDomain } from "../../../domain/website/wishlist.domain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";
import { CreateCart } from "../../../api/Request/cart";
export class WishlistService implements WishlistServiceDomain {
    private adminRepository: WishlistServiceDomain;

    constructor(adminRepository: WishlistServiceDomain) {
        this.adminRepository = adminRepository;
    }

    async updateWishlist(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.updateWishlist(id, data);
        if (result.status === "error") return result;
        return result;
    }
    async getWishlist(userId: string, options: any): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.getWishlist(userId, options);
        if (result.status === "error") return result;
        return result;
    }
    async createWishlist(data: CreateCart): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.createWishlist(data);
        if (result.status === "error") return result;
        return result;
    }
    async getWishlistCount(
        userType: string, userId: string
    ): Promise<ApiResponse<any> | ErrorResponse> {
        return this.adminRepository.getWishlistCount(userType, userId);
    }
    async getWishlistDetails(
        userType: string, userId: string, productId: string
    ): Promise<ApiResponse<any> | ErrorResponse> {
        return this.adminRepository.getWishlistDetails(userType, userId, productId);
    }
    async deleteWishlist(id: string, productId: string): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.deleteWishlist(id, productId);
        if (result.status === "error") return result;
        return result;
    }
}

export function webSiteWishlistService(repo: WishlistServiceDomain): WishlistServiceDomain {
    return new WishlistService(repo);
}
