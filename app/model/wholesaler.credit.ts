import { Schema, model } from "mongoose";

const wholeSalerCreditSchema = new Schema(
  {
    wholeSalerId: { type: Schema.Types.ObjectId, ref: "wholesalerretailers", required: true },
    creditLimit: { type: String, require: true },
    creditPeriod: { type: String, require: true },
    documentProof: [
      {
        docName: { type: String, require: true },
        docPath: { type: String, require: true },
        originalName: { type: String, require: true },
      },
    ],
    paymentTerm: {
        type: String,
        enum: ["Prepaid","Net-15","Net-30","Net-60",''],
        default: '',
    },
    paymentPreferMode: {
        type: String,
        enum: ["Bank-Transfer","Upi","Credit-Account", "Cash",''],
        default: '',
    },
    reason: { type: String, required: false, default: '' },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "adminusers", required: false, default:null },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "adminusers", required: false , default:null },
},
  { timestamps: true }
);

export const WholeSalerCreditModel = model("wholesalercredit", wholeSalerCreditSchema);
