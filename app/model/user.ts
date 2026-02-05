import mongoose, { Schema } from "mongoose";

const user = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: false },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    isVerfied: { type: Boolean, default: false },
    phone: { type: String, unique: true, required: true },
    pin: { type: String, required: false },
    otp: { type: String, required: false, default: "1234" },
    address: { type: String, required: false },
    pincode: { type: String, required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: false },
    lastName: { type: String, required: false }
  },
  {
    timestamps: {
      updatedAt: true,
      createdAt: true,
    },
  }
);

// Create the User model
const Users = mongoose.model("users", user);
// Export the User model
export default Users;
