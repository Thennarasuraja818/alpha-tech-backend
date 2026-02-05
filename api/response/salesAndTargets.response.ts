import { Types } from 'mongoose';

export interface SalesTargetResponse {
  _id: Types.ObjectId;
  salemanId: Types.ObjectId;
  targetSalesAmount: number;
  targetPeriod: 'Monthly' | 'Quarterly' | 'Yearly';
  incentiveAmount: number;
  status: 'Achieved' | 'Not Achieved' | 'Exceeded';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesTargetListResponse {
  data: SalesTargetResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const toSalesTargetResponse = (doc: any): SalesTargetResponse => ({
  _id: doc._id,
  salemanId: doc.salemanId,
  targetSalesAmount: doc.targetSalesAmount,
  targetPeriod: doc.targetPeriod,
  incentiveAmount: doc.incentiveAmount,
  status: doc.status,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});
