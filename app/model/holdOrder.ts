import { Schema, model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface HoldOrderItem {
    productId?: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    attributes: object;
    offerId?: Types.ObjectId;
    offerAmount: number;
    offerType: string;
    discount: number;
    taxRate: number;
}

export interface HoldOrderDocument {
    _id: Types.ObjectId;
    placedBy: Types.ObjectId;
    placedByModel: 'Admin' | 'AdminUser' | 'Wholesaler' | 'User' | 'Retailer';
    items: HoldOrderItem[];
    totalAmount: number;          // rounded value
    preRoundoffTotal: number;     // original before rounding
    roundoff: number;             // difference
    totalDiscount: number;
    totalTax: number;
    status: 'hold' | 'retrived';
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        contactName: string;
        contactNumber: string;
    };
    isActive: boolean;
    isDelete: boolean;
    createdBy: Types.ObjectId;
    modifiedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    paymentMode: string;
    orderFrom: string;
    orderType: string;
    deliveryCharge: number;
    packingType?: string;
    discount: number;
    reason: string;
    holdOrderId: string;
    discountValue?: number;
}

const HoldOrderItemSchema = new Schema<HoldOrderItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
        quantity: { type: Number, required: true, min: 0.001 },
        unitPrice: { type: Number, required: true, min: 0 },
        attributes: { type: Object },
        offerId: { type: Schema.Types.ObjectId, ref: 'offers', required: false, default: null },
        offerType: {
            type: String,
            enum: ['no', 'individual', 'package'],
            default: 'no',
        },
        offerAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
    },
    { _id: false }
);

const HoldOrderSchema = new Schema<HoldOrderDocument>(
    {
        placedBy: { type: Schema.Types.ObjectId, required: true, refPath: 'placedByModel' },
        placedByModel: { type: String, required: true, enum: ['Admin', 'AdminUser', 'Wholesaler', 'User', 'Retailer'] },
        items: { type: [HoldOrderItemSchema], default: [] },
        totalAmount: { type: Number, required: true, min: 0 }, // rounded
        preRoundoffTotal: { type: Number, default: 0 },        // original
        roundoff: { type: Number, default: 0 },                // difference
        totalDiscount: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },
        paymentMode: { type: String, default: '' },
        status: {
            type: String,
            enum: ['hold', 'retrived'],
            default: 'hold',
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
            contactName: String,
            contactNumber: String,
        },
        isActive: { type: Boolean, default: true },
        isDelete: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
        orderFrom: { type: String, default: 'website' },
        orderType: { type: String, default: '' },
        deliveryCharge: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        packingType: { type: String, default: '' },
        holdOrderId: {
            type: String,
            required: true,
            unique: true,
            default: () => `HOLD-${Math.floor(1000 + Math.random() * 9000)}`
        },
        discountValue: { type: Number, default: 0 },
    },
    { timestamps: true }
);

HoldOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
export const HoldOrderModel = model<HoldOrderDocument>('HoldOrder', HoldOrderSchema);