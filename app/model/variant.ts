import mongoose, { Schema } from "mongoose";

const VariantSchema = new Schema({
    name: { type: String, required: true },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true }
}, { timestamps: true });

const Variant = mongoose.model('variants', VariantSchema);
export default Variant;
