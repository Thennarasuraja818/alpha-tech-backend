import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, required: true, default: 'admin' },
  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });

const Admin = mongoose.model('admins', adminSchema);
export default Admin;
