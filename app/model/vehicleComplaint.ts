// src/app/model/VehicleComplaint.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleComplaint extends Document {
    userId: mongoose.Types.ObjectId;
    comment: string;
    proof: [{
        docName: { type: String },
        docPath: { type: String },
        originalName: { type: String },
    }];
    status: 'pending' | 'resolved' | 'in-progress';
    createdBy: mongoose.Types.ObjectId;
    modifiedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    modifiedAt: Date;
    proofType: String;
    isDelete: Boolean,
    isActive: Boolean,
}

const VehicleComplaintSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    proof: [{
        docName: { type: String },
        docPath: { type: String },
        originalName: { type: String },
    }],
    status: { type: String, enum: ['pending', 'resolved', 'in-progress'], default: 'pending' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date },
    proofType: { type: String, default: '' },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
});

export const VehicleComplaint = mongoose.model<IVehicleComplaint>('VehicleComplaint', VehicleComplaintSchema);