import { Types } from "mongoose";

export interface CouponDocumentResponse {
    _id: Types.ObjectId;
    name: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    type: 'all_products' | 'category' | 'product' | 'user';
    categoryId?: string[];
    productIds?: string[];
    userIds?: string[];
    startDate: Date;
    endDate: Date;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    isActive: boolean;
    createdBy: string;
    modifiedBy: string;
    createdAt: Date;
    updatedAt: Date;

}