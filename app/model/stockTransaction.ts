import mongoose, { Schema, Document, Types } from "mongoose";

export interface StockTransactionDocument extends Document {
  productId: Types.ObjectId;
  type: 'purchase' | 'order' | 'adjustment' | 'return';
  quantity: number;
  referenceId: Types.ObjectId; // e.g., VendorPurchase._id or Order._id
  referenceModel: 'VendorPurchase' | 'Order' | "ReturnOrder" | "PhysicalStockUpdation";
  createdBy: Types.ObjectId;
  createdAt: Date;
  remarks?: string;
}

const stockTransactionSchema = new Schema<StockTransactionDocument>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['purchase', 'order', 'adjustment', 'return', 'physical'], required: true },
  quantity: { type: Number, required: true },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  referenceModel: { type: String, enum: ['VendorPurchase', 'Order', 'VendorPurchaseReturn', 'PhysicalStockUpdation', 'ReturnOrder'], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

stockTransactionSchema.index({ productId: 1, type: 1, createdAt: -1 });

export const StockTransaction = mongoose.model<StockTransactionDocument>(
  'StockTransaction',
  stockTransactionSchema
);
