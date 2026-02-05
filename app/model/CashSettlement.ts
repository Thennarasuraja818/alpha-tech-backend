import { Schema, model } from "mongoose";

const cashSettlementSchema = new Schema(
    {
        cashToBeSettled: { type: Number, required: true },
        settlementMode: {
            type: String,
            enum: ['Handover', 'Bank', 'UPI'],
            required: true
        },
        handoverTo: {
            type: Schema.Types.ObjectId,
            ref: 'adminusers',
            default: null
        },
        settledBy: {
            type: Schema.Types.ObjectId,
            ref: 'adminusers',
            required: true
        },
        settlementDate: { type: Date, required: true },
        notes: { type: String, default: '' },
        isDelete: { type: Boolean, default: false },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'adminusers',
            required: true
        },
        modifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'adminusers',
            required: true
        },
        status: { type: String, default: 'pending' }
    },
    { timestamps: true }
);

export const CashSettlementModel = model("cashsettlements", cashSettlementSchema);
