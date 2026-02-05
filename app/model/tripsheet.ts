// app/model/tripsheet.ts
import { Schema, model, Types } from 'mongoose';

export interface TripSheetDocument {
    _id: Types.ObjectId;
    orderId: Types.ObjectId;
    deliveryman: Types.ObjectId;
    incharge: Types.ObjectId;
    loadman: Types.ObjectId[];
    vehicleId: Types.ObjectId;
    kilometer: number;
    assignmentDate: Date;
    status: 'assigned' | 'completed' | 'customer-not-available' | 'cancelled';
    completedDate?: Date;
    reason?: string; // For customer not available or cancellation
    isPendingBill?: boolean;
    createdBy: Types.ObjectId;
    isActive: boolean;
}

const tripSheetSchema = new Schema<TripSheetDocument>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        deliveryman: {
            type: Schema.Types.ObjectId,
            ref: "AdminUser",
            required: true
        },
        incharge: {
            type: Schema.Types.ObjectId,
            ref: "AdminUser",
            required: true
        },
        loadman: [{
            type: Schema.Types.ObjectId,
            ref: "AdminUser"
        }],
        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true
        },
        kilometer: {
            type: Number,
            required: true
        },
        assignmentDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['assigned', 'completed', 'customer-not-available', 'cancelled'],
            default: 'assigned'
        },
        completedDate: {
            type: Date
        },
        reason: {
            type: String
        },
        isPendingBill: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'admins',
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export const TripSheetModel = model<TripSheetDocument>('TripSheet', tripSheetSchema);