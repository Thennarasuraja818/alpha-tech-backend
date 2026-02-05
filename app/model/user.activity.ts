import mongoose, { model, Schema } from 'mongoose';

const userActivityLogSchema = new Schema({
    userName: { type: String, required: false },
    actionPerformed: { type: String, required: true },
    ipAddress: { type: String, required: true },
    deviceUsed: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
}, {
    timestamps: true
});
const UserActivityLog = model("useractivitylogs", userActivityLogSchema);

export default UserActivityLog;

