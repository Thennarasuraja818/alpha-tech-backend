import mongoose, { Document, Schema } from "mongoose";

export interface IWholesaleOrder extends Document {
  customerName: string;
  customerContact: string;
  customerDeliveryAddress: string;
  customerOrderNotes?: string;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discountApplied?: number;
  totalPrice: number;
  stockLocation: string;
  paymentMode: string;
  paymentStatus: string;
  deliveryType: string;
  deliveryPerson?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryStatus: string;
  deliveryOrderNotes?: string;
  createdBy: mongoose.Types.ObjectId;
  modifiedBy: mongoose.Types.ObjectId;

}

const WholesaleOrderSchema: Schema = new Schema(
  {
    customerName: { type: String, required: true },
    customerContact: { type: String, required: true },
    customerDeliveryAddress: { type: String, required: true },
    customerOrderNotes: { type: String, default: "" },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    stockLocation: { type: String, required: true },
    paymentMode: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    deliveryType: { type: String, required: true },
    deliveryPerson: { type: String, default: "" },
    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    deliveryStatus: { type: String, required: true },
    deliveryOrderNotes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },

  },
  { timestamps: true }
);

export default mongoose.model<IWholesaleOrder>("WholesaleOrder", WholesaleOrderSchema);
