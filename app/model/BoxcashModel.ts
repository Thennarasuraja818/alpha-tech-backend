// app/model/boxCash.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBoxCash extends Document {
  transactionType: 'pettycash' | 'purchase' | 'expense' | 'withdraw' | 'deposit' | 'collection';
  date: Date;
  userType?: 'employee' | 'notEmployee';
  employeeId?: mongoose.Types.ObjectId[];
  //   employeeName?: string;
  receiver?: string;
  paymentType?: 'IN' | 'OUT';
  amount: number;
  description?: string;
  openingBalance?: number;  // Optional - only for pettycash
  closingBalance?: number;  // Optional - only for pettycash
  expenseType?: mongoose.Types.ObjectId; // Add expense type reference
  pettyCashManagementId?: mongoose.Types.ObjectId; // Reference to PettyCashManagement
  isDelete: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BoxCashSchema = new Schema<IBoxCash>({
  transactionType: {
    type: String,
    required: true,
    enum: ['pettycash', 'expense', 'purchase', 'withdraw', 'deposit', 'collection']

  },
  date: { type: Date, required: true },
  userType: {
    type: String,
    enum: ['employee', 'notEmployee'],
    required: function (this: IBoxCash) {
      return this.transactionType !== 'pettycash' && this.transactionType !== 'withdraw' && this.transactionType !== 'deposit';
    }
  },
  employeeId: [{
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: function (this: IBoxCash) {
      return this.transactionType !== 'pettycash' && this.userType === 'employee';
    }
  }],
  expenseType: { // Add expense type field
    type: Schema.Types.ObjectId,
    ref: 'expensetypes'
  },
  //   employeeName: { 
  //     type: String,
  //     required: function(this: IBoxCash) {
  //       return this.transactionType !== 'pettycash' && this.userType === 'notEmployee';
  //     }
  //   },
  receiver: {
    type: String,
    required: function (this: IBoxCash) {
      return this.transactionType !== 'pettycash' && this.userType === 'notEmployee';
    }
  },
  amount: { type: Number, required: true, min: 0 },
  description: {
    type: String,
    required: function (this: IBoxCash) {
      return this.transactionType === 'purchase';
    }
  },
  openingBalance: {
    type: Number,
    required: false, // Make optional
    min: 0
  },
  closingBalance: {
    type: Number,
    required: false, // Make optional
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['IN', 'OUT'],
  },
  pettyCashManagementId: { type: Schema.Types.ObjectId, ref: 'PettyCashManagement' },
  isDelete: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'admins', required: true },
  modifiedBy: { type: Schema.Types.ObjectId, ref: 'admins', required: true }
}, { timestamps: true });

export const BoxCashModel = mongoose.model<IBoxCash>('BoxCash', BoxCashSchema);