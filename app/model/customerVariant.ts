import mongoose, { Schema } from "mongoose";

const user = new Schema(
    {
        name: { type: String, required: true },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false, default: null },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false, default: null },
    },
    {
        timestamps: {
            updatedAt: true,
            createdAt: true,
        },
    }
);

// Create the User model
const CustomerVariants = mongoose.model("customervariants", user);
// Export the User model
export default CustomerVariants;
