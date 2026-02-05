import { Schema, model } from "mongoose";

const paymentReceiveSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "wholesalerretailers", // or your customer collection
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "orders", // or whatever your order collection is
      required: true,
    },
    dueAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentDate: {
      type: Date,
      required: true,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "QR Code", ''],
      required: true,
      default: ''
    },
    paymentProof: {
      type: String, // file path or URL
      default: "",
    },
    payInFull: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "adminusers",
      required: true,
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "adminusers",
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    settlementId: {
      type: Schema.Types.ObjectId,
      ref: 'cashsettlements',
      default: null
    },
    status: {
      type: String,
      default: ''
    },
    createdFrom: {
      type: String,
      default: 'lineman'
    }
  },
  { timestamps: true }
);

export const PaymentReceiveModel = model("paymentreceives", paymentReceiveSchema);
