import mongoose, { Schema } from "mongoose";

const vendorSchema = new Schema({
    vendorCode: { type: String, required: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: false, default: null },
    phoneNumber: { type: String, required: true },
    email: {
        type: String,
        required: false,
        default: null,
        index: true,
        sparse: true
    }, paymentDueDays: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String, required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    bankName: { type: String, required: false, default: null },
    accountNumber: { type: String, required: false, default: null },
    ifscCode: { type: String, required: false, default: null },
    city: { type: String, required: true, default: null },
    alternativeNumber: { type: String, required: false, default: null },
    products: [{ id: { type: Schema.Types.ObjectId, ref: "products", required: false } }]
},
    { timestamps: true }
)
vendorSchema.index({ email: 1 }, { sparse: true, unique: true });

const Vendor = mongoose.model('vendors', vendorSchema);
export default Vendor;
