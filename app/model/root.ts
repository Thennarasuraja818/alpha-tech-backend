import { Schema, model } from "mongoose";

const rootSchema = new Schema(
  {
    rootName: { type: String, required: true },
    pincode: [{ code: { type: String } }],
    salesman: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    crmUser: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    deliveryCharge: { type: Number, required: true },
    deliveryman: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },

    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    variants: [{
      from: { type: Number},
      to: { type: Number},
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 }
    }]
  },
  { timestamps: true }
);

export const RootModel = model("root", rootSchema);
