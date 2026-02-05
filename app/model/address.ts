

import mongoose, { Schema } from "mongoose";

const adminTokenSchema = new Schema({
    contactName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    label: { type: String, enum: ['HOME', 'WORK', 'OTHER'], required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    userId: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true });

const UserAddress = mongoose.model('useraddress', adminTokenSchema);
export default UserAddress;
