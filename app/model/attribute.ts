import mongoose, { Schema } from "mongoose";

const AttributeSchema = new Schema({
    name: { type: String, required: true },
    value: {type: [{value: {type: String,required: true }}],required: true},
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true }
   }, { timestamps: true })

   const Attribute = mongoose.model('attributes', AttributeSchema);
   export default Attribute;
