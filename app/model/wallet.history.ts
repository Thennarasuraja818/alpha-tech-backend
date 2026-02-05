// walletTransaction.model.ts
import { Schema, model, Types } from "mongoose";

const WalletTransactionSchema = new Schema({
    walletId: { type: Types.ObjectId, ref: "Wallet", required: true },
    userId: { type: Types.ObjectId, ref: "Wholesaler", required: true },

    amount: { type: Number, required: true }, // transaction amount
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    orderId: { type: Types.ObjectId, ref: 'Orders' }, // OrderId / PaymentId / RefundId
    referenceType: { type: String }, // "Order", "Refund", "AdminAdjustment", etc.

    description: { type: String }, // e.g. "Refund for Order #123", "Wallet Top-up"
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
}, { timestamps: true });

export const WalletTransaction = model("WalletTransaction", WalletTransactionSchema);
