import mongoose, { Schema, Document } from 'mongoose';

export interface IDenomination {
  value: number | string;
  count?: number | null;
  total: number;
}

export interface IBoxCashManagement extends Document {
  date: Date;
  pettyCashOpeningAmount: number;
  expenseAmount: number;
  purchaseAmount: number;
  withdrawAmount: number;
  depositAmount: number;
  collectionAmount: number;
  pettyCashClosingAmount: number;
  openingBalance: number;
  closingBalance: number;
  denominations: IDenomination[];
  description?: string;
  differenceType?: 'excess' | 'shortage' | 'balanced' | 'pending';
  differenceAmount?: number;
  isDelete: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DenominationSchema = new Schema({
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  count: {
    type: Number,
    required: false,
    default: null
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const BoxCashManagementSchema = new Schema<IBoxCashManagement>(
  {
    date: {
      type: Date,
      required: true,
      unique: true 
    },
    pettyCashOpeningAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    expenseAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    purchaseAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    withdrawAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    collectionAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    pettyCashClosingAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    openingBalance: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    closingBalance: {
      type: Number,
      required: true,
      //   min: 0,
      default: 0
    },
    denominations: {
      type: [DenominationSchema],
      default: []
    },
    differenceType: {
      type: String,
      enum: ['excess', 'shortage', 'balanced', 'pending'],
      required: false
    },
    differenceAmount: {
      type: Number,
      required: false,
      min: 0
    },
    description: {
      type: String,
      required: false
    },
    isDelete: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'admins', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'admins', required: true }
  },
  { timestamps: true }
);

// Indexes
BoxCashManagementSchema.index({ isDelete: 1 });
BoxCashManagementSchema.index({ isActive: 1 });

export const BoxCashManagementModel = mongoose.model<IBoxCashManagement>(
  'BoxCashManagement',
  BoxCashManagementSchema
);