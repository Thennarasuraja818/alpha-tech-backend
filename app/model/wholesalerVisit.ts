import mongoose, { Schema } from "mongoose";

const customerVisitSchema = new Schema(
    {
        wholeSalerId: {
            type: Schema.Types.ObjectId,
            ref: "wholesalerretailers", // Adjust based on your actual customer model name
            required: true,
        },
        visitPurpose: {
            type: String,
            enum: ["New Visit", "Order Placement", "Payment Collection", "Return & Exchange"],
            required: true,
        },
        followUpDate: { type: Date, default: null },
        visitNotes: { type: String, default: '' },
        status: { type: String, default: '' },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "adminusers", required: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "adminusers", required: true },
        startTime: { type: String, default: '' },
        endTime: { type: String, default: '' }
    },
    {
        timestamps: true,
    }
);

const WholesalerVisitModel = mongoose.model("wholesalervisits", customerVisitSchema);
export default WholesalerVisitModel;
