import mongoose, { Schema } from "mongoose";

const adminTokenSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'admins', required: true },
  token: { type: String, required: true },
  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });

const AdminToken = mongoose.model('admintokens', adminTokenSchema);
export default AdminToken;
