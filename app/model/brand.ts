import mongoose, { Schema } from "mongoose";

const BrandSchema = new Schema({
    name: { type: String, required: true },
    logo:{
        docName: { type: String,  required: false ,default:''  },
        docPath: { type: String, required: false ,default:'' },
        originalName: { type: String,  required: false ,default:''}
     },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true }
   }, { timestamps: true })

   const Brand = mongoose.model('brands', BrandSchema);
   export default Brand;
