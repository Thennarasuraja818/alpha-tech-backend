// wallet.model.ts
import { Schema, model, Types } from "mongoose";

const WalletSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "Wholesaler", required: true, unique: true }, // One wallet per user
    balance: { type: Number, required: true, default: 0 }, // Current wallet balance
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
}, { timestamps: true });

export const Wallet = model("Wallet", WalletSchema);
