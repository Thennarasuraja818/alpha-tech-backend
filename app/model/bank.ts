import { Schema, model, Document } from "mongoose";

export interface IBank extends Document {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: "SAVING" | "CURRENT";
  branch: string;
  status: "active" | "inactive";
  isActive: boolean;
  isDelete: boolean;
  createdBy: Schema.Types.ObjectId;
  modifiedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankSchema = new Schema<IBank>(
  {
    bankName: { 
        type: String, 
        required: true, 
        trim: true,
        uppercase: true 
    },
    accountNumber: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    ifscCode: { 
        type: String, 
        required: true,
        uppercase: true,
        trim: true 
    },
    accountType: {
      type: String,
      enum: ["SAVING", "CURRENT"],
      required: true,
    },
    branch: { 
        type: String, 
        required: true,
        trim: true 
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique account number within active, non-deleted records
BankSchema.index({ 
    accountNumber: 1, 
    isActive: 1, 
    isDelete: 1 
}, { 
    unique: true,
    partialFilterExpression: { isActive: true, isDelete: false }
});

export const BankModel = model<IBank>("Bank", BankSchema);