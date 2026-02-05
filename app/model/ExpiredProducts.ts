import mongoose, { Schema } from "mongoose";

const user = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Products", required: false },
        attributes: {
            type: Object,
        },
        purchasedId: { type: Schema.Types.ObjectId, ref: "vendorpurchased", required: false },
        expiredDate: { type: String, },
        quantityExpired: { type: Number, default: 0 },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
        notes: { type: String, default: '' }
    },
    {
        timestamps: true
    }
);

// Create the User model
const ExpiredProductsManagement = mongoose.model("ExpiredProductsManagement", user);
// Export the User model
export default ExpiredProductsManagement;
