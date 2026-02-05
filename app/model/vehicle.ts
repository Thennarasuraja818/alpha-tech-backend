import { Schema, model, Document } from "mongoose";

export interface IVehicle extends Document {
  vehicleNumber: string;
  fcDate?: Date;
  insuranceDate?: Date;
  taxDate?: Date;      
  permitDate?: Date;   
  advertiseDate?: Date;
  pollutionDate?: Date;
  status: "active" | "inactive" | "expired";
  isActive: boolean;
  isDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleNumber: { type: String, required: true, unique: true, trim: true },
    fcDate: { type: Date, default: null },
    insuranceDate: { type: Date, default: null },
    taxDate: { type: Date, default: null },
    permitDate: { type: Date, default: null },
    advertiseDate: { type: Date, default: null },
    pollutionDate: { type: Date, default: null },
       status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const VehicleModel = model<IVehicle>("Vehicle", VehicleSchema);
