import mongoose, { Schema } from "mongoose";

const user = new Schema(
    {
        pickedUpIds: { type: Array, required: true },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
        status: { type: String, default: 'pending' },
        date: { type: String, default: '' },
        handOverTo: {
            type: Schema.Types.ObjectId, ref: "AdminUser", required: false
        }
    },
    {
        timestamps: {
            updatedAt: true,
            createdAt: true,
        },
    }
);

// Create the User model
const ReturnPickedUpSettled = mongoose.model("returnpickedupsettled", user);
// Export the User model
export default ReturnPickedUpSettled;
