import mongoose, { Schema } from "mongoose";

const user = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: "orders", required: false },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
        status: { type: String, default: 'pending' },
        settlementId: { type: Schema.Types.ObjectId, ref: "returnpickedupsettled", required: false }
    },
    {
        timestamps: {
            updatedAt: true,
            createdAt: true,
        },
    }
);

// Create the User model
const ReturnPickedUp = mongoose.model("returnpickedups", user);
// Export the User model
export default ReturnPickedUp;
