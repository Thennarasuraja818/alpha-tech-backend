import mongoose, { Schema, Document } from 'mongoose';

export interface IDenomination {
  value: number | string;
  count?: number | null;
  total: number;
}
export interface IPettyCashManagement extends Document {
  date: Date;
  initialAmount?: number;
  salesAmount?: number;
  expensesAmount?: number;
  closingAmount?: number;
  receiver?: mongoose.Types.ObjectId;
  handover?: mongoose.Types.ObjectId;
  giver?: mongoose.Types.ObjectId;
  differenceAmount?: number;
  differenceType?: 'excess' | 'shortage' | 'balanced';
  isDelete: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  modifiedBy?: mongoose.Types.ObjectId;
  denominations?: IDenomination[];
  adminApproved?: boolean;

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

const PettyCashManagementSchema = new Schema<IPettyCashManagement>(
  {
    date: { type: Date, required: true },
    initialAmount: { type: Number, required: true, min: 0 },
    salesAmount: { type: Number, required: false, min: 0 },
    expensesAmount: { type: Number, required: false, min: 0.01 },
    closingAmount: { type: Number, required: false, min: 0 },
    differenceAmount: { type: Number, required: false, min: 0 },
    differenceType: { type: String, enum: ['excess', 'shortage', 'balanced', 'pending'], required: false },
    giver: { type: Schema.Types.ObjectId, ref: 'adminusers', required: false },
    receiver: { type: Schema.Types.ObjectId, ref: 'adminusers', required: false },
    handover: { type: Schema.Types.ObjectId, ref: 'adminusers', required: false },
    adminApproved: { type: Boolean, default: false },
    denominations: {
      type: [DenominationSchema],
      default: []
    },
    isDelete: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'admins' },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
  },
  { timestamps: true }
);

// Indexes (if needed for filtering)
PettyCashManagementSchema.index({ date: 1 });
PettyCashManagementSchema.index({ isDelete: 1 });
PettyCashManagementSchema.index({ isActive: 1 });

export const PettyCashManagementModel = mongoose.model<IPettyCashManagement>(
  'PettyCashManagement',
  PettyCashManagementSchema
);
