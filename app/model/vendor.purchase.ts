import mongoose, { Schema } from "mongoose";

const vendorSchema = new Schema({
    vendorId: { type: Schema.Types.ObjectId, ref: "vendors", required: false, default: null },
    notVendor: { type: String, required: false, default: "others" },
    products: [{
        id: { type: Schema.Types.ObjectId, ref: "products", required: false },
        attributes: {
            type: Object,
        },
        buyingPrice: { type: Number, default: 0 },
        sellingPrice: { type: Number, default: 0 },
        quantity: { type: Number, default: 0 },
        quantityReceived: { type: Number, default: 0 },
        isProductReceived: { type: Boolean, required: true, default: false },
        expiryDate: { type: String }
    }],
    status: { type: String, default: "Pending" },
    orderId: { type: String, default: "" },
    totalPrice: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    amountPaid: { type: Number, default: 0 },
    amountPending: { type: Number, default: 0 },
    paymentMode: { type: String, default: "" },
    invoiceId: { type: String, default: '' },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid', 'Failed'],
        default: 'Pending',
    },
    paymentHistory: [{
        amountPaid: { type: Number, default: 0 },
        amountPending: { type: Number, default: 0 },
        date: { type: Date }
    }]
},
    { timestamps: true }
)

const Vendorpurchase = mongoose.model('vendorpurchase', vendorSchema);
export default Vendorpurchase;
