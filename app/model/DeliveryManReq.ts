import mongoose, { Schema } from "mongoose";

const userToken = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "adminusers", required: true },
        type: { type: String, default: '' },
        notes: { type: String, default: '' },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        status: { type: String, default: 'pending' },
    },
    {
        timestamps: true
    }
);

// Create the User model
const DeliveryManReq = mongoose.model("deliverymansreqs", userToken);
// Export the User model
export default DeliveryManReq;
