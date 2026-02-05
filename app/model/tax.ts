import { Schema, model } from "mongoose";

const taxSchema = new Schema({
    taxName: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        maxlength: 50 
    },
    taxType: { 
        type: String, 
        required: true,
        enum: ['GST', 'VAT', 'Service Tax', 'Other',"Percentage",'Fixed Amount']
    },
    taxRate: { 
        type: Number, 
        required: true,
        min: 0,
        max: 100
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: "admins",
        required: true 
    },
    modifiedBy: { 
        type: Schema.Types.ObjectId, 
        ref: "admins" 
    }
}, { 
    timestamps: true,
    versionKey: false 
});


export default model("Tax", taxSchema);