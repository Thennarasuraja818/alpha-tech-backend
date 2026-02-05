import mongoose, { Schema, model } from "mongoose";

const couponSchema = new Schema({
    name: { type: String, required: true },
    code: {
        type: String,
        required: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    minOrderAmount: {
        type: Number,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['all_products', 'category', 'product', 'user'],
        required: true
    },
    categoryId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    userIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },


    isActive: {
        type: Boolean,
        default: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

export const CouponModel = model("Coupon", couponSchema);
