import mongoose, { Schema, Document } from 'mongoose';

export interface IPettyCash extends Document {
  date: Date;
  amount: number;
  receiver: string;
  employeeId: mongoose.Types.ObjectId;
  description: string;
  paymentMode: "cash" | "upi" | "bank_transfer" | "cheque";
  transactionType: "deposit" | "withdrawal" | "expense" |"purchase";
  // referenceNumber?: string;
  // documents?: Array<{
  //   docName: string;
  //   docPath: string;
  //   originalName: string;
  // }>;
  isDelete: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema({
  docName: { type: String },
  docPath: { type: String },
  originalName: { type: String }
}, { _id: false });

const PettyCashSchema = new Schema<IPettyCash>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  receiver: { type: String, required: false, trim: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: false },
  description: { type: String, required: true, trim: true },
  paymentMode: { 
    type: String, 
    required: true, 
    enum: [ "cash", "upi", "bank_transfer", "cheque"] 
  },
  transactionType: { 
    type: String, 
    required: true, 
    enum: ["deposit", "withdrawal", "expense","purchase"] 
  },
  // referenceNumber: { type: String, trim: true, sparse: true, unique: true },
  // documents: [DocumentSchema],
  isDelete: { type: Boolean, default: false, required: true },
  isActive: { type: Boolean, default: true, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'admins', optional: true },
  modifiedBy: { type: Schema.Types.ObjectId, ref: 'admins', optional: true }
}, { timestamps: true });

// Indexes
PettyCashSchema.index({ date: 1 });
PettyCashSchema.index({ transactionType: 1 });
PettyCashSchema.index({ paymentMode: 1 });
PettyCashSchema.index({ isDelete: 1 });
PettyCashSchema.index({ isActive: 1 });

export const PettyCashModel = mongoose.model<IPettyCash>('PettyCash', PettyCashSchema);
