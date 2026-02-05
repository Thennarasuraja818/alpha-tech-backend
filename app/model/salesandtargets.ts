import { Schema, model } from "mongoose";
const salesTargetSchema = new Schema(
    {
        salemanId: {
            type: Schema.Types.ObjectId, ref: 'adminusers'
        },
        targetSalesAmount: {
            type: Number,
            required: true
        },
        targetPeriod: {
            type: String,
            enum: ['Monthly', 'Quarterly', 'Yearly'], // Add other options if needed
            required: true
        },
        incentiveAmount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['Achieved', 'Not Achieved', 'Exceeded'],
            default: 'Not Achieved'
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
    },
    { timestamps: true }
);

export const SalesandTargets = model("salesandtargets", salesTargetSchema);