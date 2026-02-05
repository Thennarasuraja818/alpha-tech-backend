import mongoose, { Schema } from "mongoose";

const userToken = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "adminusers", required: true },
        start: { type: Number, required: true, default: 0 },
        end: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true, default: 0 },
        beforeImg: [{
            docName: { type: String },
            docPath: { type: String },
            originalName: { type: String },
        }],
        afterImg: [{
            docName: { type: String },
            docPath: { type: String },
            originalName: { type: String },
        }],
        date: { type: String, default: '' },
        isDelete: { type: Boolean, required: true, default: false },
        isActive: { type: Boolean, required: true, default: true },
    },
    {
        timestamps: true
    }
);

// Create the User model
const KilometerHistory = mongoose.model("kilometerhistorys", userToken);
// Export the User model
export default KilometerHistory;
