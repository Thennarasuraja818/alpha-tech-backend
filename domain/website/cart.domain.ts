import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CartList, CreateCart } from "../../api/Request/cart";
import { ICart } from "../../app/model/cart";
export interface ICartRepository {
  createCart(data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  updateCart(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  getCart(userId: string, options: CartList): Promise<ApiResponse<{ items: ICart[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  getCartCount(userType: string, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
  getCartDetails(userId: string, userType: string, productId: string): Promise<ApiResponse<any> | ErrorResponse>;
  deleteCart(cart: string, productId: string, offer: boolean): Promise<ApiResponse<any> | ErrorResponse>;

}

// Service layer interface (no createCart here as per spec)
export interface CartServiceDomain {
  createCart(data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  updateCart(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse>;
  getCart(userId: string, options: any): Promise<ApiResponse<{ items: ICart[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  getCartCount(userType: string, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
  getCartDetails(userId: string, userType: string, productId: string): Promise<ApiResponse<any> | ErrorResponse>;
  deleteCart(cart: string, productId: string, offer: boolean): Promise<ApiResponse<any> | ErrorResponse>;

  // Define other cart-related service methods if needed
}
