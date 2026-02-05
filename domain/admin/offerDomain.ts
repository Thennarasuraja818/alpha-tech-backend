import { CreateOfferInput, UpdateOfferInput } from '../../api/Request/offer';
import { ApiResponse, ErrorResponse, SuccessMessage } from '../../api/response/commonResponse';
import { PaginationResult } from '../../api/response/paginationResponse';
import { ProductListParams } from '../mobile-app/productDomain';
export interface OfferDtls {
  _id: string;
  title: string;
  description: string;
  brand: { _id: string; name: string };
  discount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy: string;
  fixedAmount: Number;
  offerType: String;
}

export interface OfferDomainRepository {
  createOffer(input: CreateOfferInput, userId: string): Promise<ApiResponse<any> | ErrorResponse>;
  updateOffer(input: UpdateOfferInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  findOfferById(id: string): Promise<ApiResponse<any> | ErrorResponse>;
  listOffers(params: { page: number; limit: number; type?: string }): Promise<PaginationResult<OfferDtls> | ErrorResponse>;
  deleteOffer(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
  listCoupons(params: ProductListParams): Promise<PaginationResult<any> | ErrorResponse>;
}