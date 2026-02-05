import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false },
    roleId: { type: Schema.Types.ObjectId, ref: "AdminUserRole", required: true },
    dateOfJoining: { type: Date, required: false },
    dateOfBirth: { type: Date, required: false },
    salary: { type: Number, required: false },
    aadhar: { type: String, required: false },
    password: { type: String, required: true },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
    salesWithCollection: { type: Boolean, required: false, default: false },
    orderStatusChangePermission: { type: Boolean, required: false, default: false },
    cashHandoverUser: { type: Boolean, required: false, default: false },
    returnOrderCollectedUser: { type: Boolean, required: false, default: false },
    bloodGroup: {
      type: String,
      required: false,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    permanentAddress: { type: String, required: false },
    presentAddress: { type: String, required: false },
    emergencyContactNumber: { type: String, required: false },
    relationship: { type: String, required: false },
    bankName: { type: String, required: false },
    ifscCode: { type: String, required: false },
    branch: { type: String, required: false },
    accountNumber: { type: String, required: false },
    fcmToken: { type: String, default: null },
    profileImage: [
      {
        docName: { type: String, required: true },
        docPath: { type: String, required: true },
        originalName: { type: String, required: true },
      }
    ]
  },
  { timestamps: true }
);

const AdminUsers = mongoose.model("AdminUser", adminSchema);
export default AdminUsers;