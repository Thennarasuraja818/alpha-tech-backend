import mongoose, { Schema } from "mongoose";

const OfferSchema = new Schema(
    {
        offerName: { type: String, required: true },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "adminusers", required: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: "adminusers", required: true },

        categoryId: [{
            id: { type: Schema.Types.ObjectId, ref: "categories", required: true }
        }],

        productId: [{
            id: { type: Schema.Types.ObjectId, ref: "products", required: true },
            attributes: { type: Object }
        }],

        images: [{
            docName: String,
            docPath: String,
            originalName: String,
        }],

        discount: { type: Number, default: 0 },
        startDate: { type: Date },
        endDate: { type: Date },
        fixedAmount: { type: Number, default: 0 },
        offerType: { type: String, default: '' },
        stock: { type: Number, default: 0 },
        mrpPrice: { type: Number, default: 0 }
    },
    { timestamps: true }
);

OfferSchema.pre("save", function (next) {
    if (this.endDate && new Date(this.endDate) < new Date()) {
        this.isActive = false;
    }
    next();
});

const OfferModel = mongoose.model("offers", OfferSchema);
export default OfferModel;
