import { model, Schema } from "mongoose";

const historySchema = new Schema({
  history: {type: Array, default: [] },
  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
  modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true }
}, { timestamps: true });

export const HistoryModel = model("histoey", historySchema);

