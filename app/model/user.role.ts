import mongoose, { Schema } from "mongoose";
import { string } from "zod";

const userRole = new Schema(
  {
    roleName: { type: String, required: true },
    rolePermissions: [
      {
      
        feature: { type: String, required: true },
        view: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
    ],
    isDelete: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: false },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: false },
  },
  {
    timestamps: true,
  }
);

const UserRole = mongoose.model("userRole", userRole);
export default UserRole;
