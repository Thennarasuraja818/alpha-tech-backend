import { Schema, model, Types } from 'mongoose';

interface OrderItem {
    productId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    attributes: object;
    offerId: any;
    offerAmount: number;
    offerType: string
}

export interface OrderDocument {
    _id: Types.ObjectId;
    orderCode: string;
    placedBy: Types.ObjectId;
    placedByModel: 'Admin' | 'AdminUser' | 'Wholesaler' | 'User' | 'Retailer';
    items: OrderItem[];
    totalAmount: number;
    status: 'Return Requested' | 'Pending' | 'Approved' | 'Pickup Scheduled' | 'Item Picked Up' | 'Received at Warehouse';
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        contactName: String;
        contactNumber: String;
    };
    isActive: boolean;
    isDelete: boolean;
    createdBy: Types.ObjectId;
    modifiedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    paymentMode: { type: String };
    returnOrderFrom: { type: string, default: 'website' };
    orderType: { type: String, default: '' };
    deliveryCharge: { type: Number };
    orderId: Types.ObjectId;
    subTotal: number;
    totalTaxValue: number;
    paymentStatus: 'Pending' | 'Refund Initiated' | 'Refund Completed' | 'Failed';
    isExchangeFlag: boolean;
    reason: string
}

const orderItemSchema = new Schema<OrderItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        attributes: { type: Object },
        offerId: { type: Schema.Types.ObjectId, ref: 'offers', required: false, default: null },
        offerType: {
            type: String,
            enum: ['no', 'individual', 'package'],
            default: 'no',
        },
        offerAmount: { type: Number, default: 0 },

    },
    { _id: false }
);
const orderSchema = new Schema<OrderDocument>(
    {
        orderCode: { type: String, required: true, unique: true },
        placedBy: { type: Schema.Types.ObjectId, required: true, refPath: 'placedByModel' },
        placedByModel: { type: String, required: true, enum: ['Admin', 'AdminUser', 'Wholesaler', 'User', 'Retailer'] },
        items: { type: [orderItemSchema], default: [] },
        paymentMode: { type: String, required: true },
        status: {
            type: String,
            enum: [
                'Return Requested',
                'Pending',
                'Approved',
                'Pickup Scheduled',
                'Item Picked Up',
                'Received at Warehouse',
                'Received at Warehouse'
            ],
            default: 'Pending'
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
        returnOrderFrom: { type: String, default: 'website' },
        deliveryCharge: { type: Number, default: 0 },
        orderId: { type: Schema.Types.ObjectId, ref: 'Orders', required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        subTotal: { type: Number, required: true, min: 0 },
        totalTaxValue: { type: Number, required: true, min: 0 },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Refund Initiated', 'Refund Completed', 'Failed'],
            default: 'Pending'
        },
        isExchangeFlag: { type: Boolean, default: false },
        reason: { type: String, default: '' }
    },
    { timestamps: true }
);

export const ReturnOrderModel = model<OrderDocument>('ReturnOrder', orderSchema);