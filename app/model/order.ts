import { Schema, model, Types } from 'mongoose';

interface OrderItem {
    productId?: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    attributes: object;
    offerId: any;
    offerAmount: number;
    offerType: string
    discount: number;
    taxRate: number;
}

interface CreditMang {

    paidAmount: number,
    paidDateAndTime: Date,
    recivedUserId: Types.ObjectId;
    paymentType: string
}
export interface OrderDocument {
    _id: Types.ObjectId;
    orderCode: string;
    placedBy: Types.ObjectId;
    placedByModel: 'admins' | 'AdminUser' | 'Wholesaler' | 'User' | 'Retailer';
    items: OrderItem[];
    totalAmount: number;          // rounded value
    preRoundoffTotal: number;     // original before rounding
    roundoff: number;             // difference
    totalTax: number,
    amountPaid: number;
    amountPending: number;
    creditId: Types.ObjectId;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'packed' | 'return-initiated' | 'return-approved' | 'return-cancelled' | 'exchange-initiated';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'partially-paid';
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
    WorkerAssignDate: Date;
    paymentMode: { type: String };
    orderFrom: { type: string, default: 'website' };
    orderType: { type: String, default: '' };
    creditManagement: CreditMang[],
    deliveryCharge: { type: Number },
    packingType: String,
    reason: String;
    invoiceId?: String;
    paymentProcessed: Number;
    otp: Number;
    reorder: Boolean;
    reorderId: Types.ObjectId;
    orderId?: String;
    manualPayment: Boolean;
    mannualPaymentMethod: String;
    deliveryman: Types.ObjectId;
    incharge: Types.ObjectId;
    loadman?: Types.ObjectId[];
    vehicleId: Types.ObjectId;
    kilometer?: number;
    walletAmount: number
    packedDate?: Date | null;
    deliveredDate?: Date | null;
    cancelledDate?: Date | null;
    cancelReason?: String;
    discount?: number

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
        discount: { type: Number, required: false },
        taxRate: { type: Number, required: false },

    },
    { _id: false }
);

const creditManageMent = new Schema(
    {
        paidAmount: { type: Number, required: false, default: null },
        paidDateAndTime: { type: Date, default: '' },
        recivedUserId: { type: Schema.Types.ObjectId, ref: 'admins', required: false, default: null },
        paymentType: { type: String, required: false, default: null },
    }
)

const orderSchema = new Schema<OrderDocument>(
    {
        orderCode: { type: String, required: true, unique: true },
        placedBy: { type: Schema.Types.ObjectId, required: true, refPath: 'placedByModel' },
        placedByModel: { type: String, required: true, enum: ['admins', 'AdminUser', 'Wholesaler', 'User', 'Retailer'] },
        items: { type: [orderItemSchema], default: [] },
        totalAmount: { type: Number, required: true, min: 0 },
        preRoundoffTotal: { type: Number, default: 0 },
        roundoff: { type: Number, default: 0 },
        totalTax: { type: Number, required: false },
        amountPaid: { type: Number, default: 0 },
        amountPending: { type: Number, default: 0 },
        paymentMode: { type: String, required: false, default: '' },
        creditId: { type: Schema.Types.ObjectId, ref: 'wholesalercredit', required: false },
        creditManagement: { type: [creditManageMent], required: false },
        status: {
            type: String,
            enum: ['pending', 'packed', 'shipped', 'delivered', 'cancelled', 'return-initiated', 'return-approved', 'return-cancelled', 'exchange-initiated', 'reorder'],
            default: 'pending',
        },
        packedDate: { type: Date, default: null },
        WorkerAssignDate: { type: Date, default: null },
        deliveredDate: { type: Date, default: null },
        cancelledDate: { type: Date, default: null },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partially-paid', 'paid', 'failed'],
            default: 'pending',
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
        createdBy: { type: Schema.Types.ObjectId, ref: 'admins' },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
        orderFrom: { type: String, default: 'website' },
        orderType: { type: String, default: '' },
        deliveryCharge: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        invoiceId: {
            type: String,
            default: null,
            required: false
        },
        paymentProcessed: { type: Number, default: 0 },
        otp: { type: Number, default: 123456 },
        reorder: { type: Boolean, default: false },
        reorderId: { type: Schema.Types.ObjectId, ref: 'orders', default: null },
        manualPayment: { type: Boolean, default: false },
        mannualPaymentMethod: { type: String, default: '' },
        deliveryman: { type: Schema.Types.ObjectId, ref: "AdminUser" },
        incharge: { type: Schema.Types.ObjectId, ref: "AdminUser" },
        loadman: [{ type: Schema.Types.ObjectId, ref: "AdminUser" }],
        vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
        kilometer: { type: Number, default: 0 },
        walletAmount: { type: Number, default: 0 },
        cancelReason: { type: String, default: '' },
        discount: { type: Number, default: 0, required: false }
    },
    { timestamps: true }
);

export const OrderModel = model<OrderDocument>('Order', orderSchema);