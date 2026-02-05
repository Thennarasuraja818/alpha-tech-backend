import { IPettyCash } from "../../app/model/pettyCash";
import { Document, ObjectId } from "mongoose";

export interface PettyCashResponse
  extends Omit<IPettyCash, keyof Document | "_id"> {
  _id: string;   // now allowed
  __v?: number;
}

export interface PettyCashSummaryResponse {
  totalDeposits: number;
  totalWithdrawals: number;
  totalExpenses: number;
  balance: number;
  startDate: Date;
  endDate: Date;
}

export interface PettyCashListResponse {
  items: PettyCashResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
