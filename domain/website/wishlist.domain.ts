import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CartList, CreateCart } from "../../api/Request/cart";
import { IWishList } from "../../app/model/wishlist";

export interface IWishListRepository {
  createWishlist(data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  updateWishlist(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  getWishlist(userId: string, options: CartList): Promise<ApiResponse<{ items: IWishList[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  getWishlistCount(userType: string, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
  getWishlistDetails(userId: string, userType: string, productId: string): Promise<ApiResponse<any> | ErrorResponse>;
  deleteWishlist(productId: string, userId: string): Promise<ApiResponse<any> | ErrorResponse>;

}

// Service layer interface (no createCart here as per spec)
export interface WishlistServiceDomain {
  createWishlist(data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  updateWishlist(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  getWishlist(userId: string, options: CartList): Promise<ApiResponse<{ items: IWishList[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  getWishlistCount(userType: string, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
  getWishlistDetails(userId: string, userType: string, productId: string): Promise<ApiResponse<any> | ErrorResponse>;
  deleteWishlist(productId: string, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
}
