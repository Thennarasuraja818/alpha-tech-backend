import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    // permission: { type: Schema.Types.ObjectId, ref: "AdminUserRoles", required: true },
  },
  { timestamps: true }
);

const AdminUserRole = mongoose.model("AdminUserRole", adminSchema);
export default AdminUserRole;
