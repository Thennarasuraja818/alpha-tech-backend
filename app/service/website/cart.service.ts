import { CartServiceDomain } from "../../../domain/website/cart.domain";
import { CreateCart } from "../../../api/Request/cart";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";
import { ICart } from "../../model/cart";
export class CartService implements CartServiceDomain {
  private adminRepository: CartServiceDomain;

  constructor(adminRepository: CartServiceDomain) {
    this.adminRepository = adminRepository;
  }
  async updateCart(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse> {
    const result = await this.adminRepository.updateCart(id, data);
    if (result.status === "error") return result;
    return result;
  }
  async getCart(userId: string, options: any): Promise<ApiResponse<any> | ErrorResponse> {
    const result = await this.adminRepository.getCart(userId, options);
    if (result.status === "error") return result;
    return result;
  }
  async createCart(data: CreateCart): Promise<ApiResponse<any> | ErrorResponse> {
    const result = await this.adminRepository.createCart(data);
    if (result.status === "error") return result;
    return result;
  }
  async createUser(
    data: CreateCart
  ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
    const result = await this.adminRepository.createCart(data);
    if (result.status === "error") return result;
    // result is ApiResponse<AdminUser>
    return result;
  }
  async getCartCount(
    userType: string, userId: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.getCartCount(userType, userId);
  }
  async getCartDetails(
    userType: string, userId: string, productId: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    return this.adminRepository.getCartDetails(userType, userId, productId);
  }
  async deleteCart(id: string, productId: string, offer: boolean): Promise<ApiResponse<any> | ErrorResponse> {
    const result = await this.adminRepository.deleteCart(id, productId, offer);
    if (result.status === "error") return result;
    return result;
  }
}

export function webSiteCartService(repo: CartServiceDomain): CartServiceDomain {
  return new CartService(repo);
}
