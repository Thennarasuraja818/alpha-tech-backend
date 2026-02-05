import mongoose, { Schema } from "mongoose";

const user = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: false, default: '' },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        isVerfied: { type: Boolean, default: false },
        phone: { type: String, unique: true, required: true },
        pin: { type: String, required: false },
        customerType: { type: String, require: true },
        companyName: { type: String, require: true },
        contactPersonName: { type: String, require: true },
        designation: { type: String, require: true },
        mobileNumber: { type: String, require: true },
        // address: { type: String, require: true },
        address: {
            country: { type: String, required: true, default: "India" },
            state: { type: String, required: true },
            city: { type: String, required: false },
            addressLine: { type: String, required: false },
            postalCode: { type: String, required: true }
        },
        // location: { type: String, require: false },
        gstNumber: { type: String, require: true },
        otp: { type: String, required: false, default: "1234" },
        createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false, default: null },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false, default: null },
        status: { type: String, required: false, default: "pending" },
        Id: { type: String, required: true },
        discount: { type: String, required: false, default: null },
        customerVariant: { type: Schema.Types.ObjectId, ref: "customervariants", required: false, default: new mongoose.Types.ObjectId("6883431137082a8e99b9df9a") },
        shopType: { type: Schema.Types.ObjectId, ref: "shoptypes", required: false, default: null },
        shopImage: [{
            docName: { type: String, required: false, default: null },
            docPath: { type: String, required: false, default: null },
            originalName: { type: String, required: false, default: null },
        }],
        location: {

            latitude: { type: String, required: false, default: null },
            longitude: { type: String, required: false, default: null },
            address: { type: String, required: false, default: null }
        },
        deviceToken: { type: String, required: false, default: '' }

    },
    {
        timestamps: {
            updatedAt: true,
            createdAt: true,
        },
    }
);

// Create the User model
const WholesalerRetailsers = mongoose.model("wholesalerretailers", user);
// Export the User model
export default WholesalerRetailsers;
