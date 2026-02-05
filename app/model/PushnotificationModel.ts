import mongoose, { Schema } from 'mongoose';

const emailTemplateSchema = new Schema({
    subject: { type: String, default: "" },
    content: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId },
    moduleId: { type: Schema.Types.ObjectId },
    companyId: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    modifiedBy: { type: Schema.Types.ObjectId, default: null },
    isActive: { type: Number, default: 1 },
    isDelete: { type: Number, default: 0 },
    moduleName: { type: String, default: '' },
},
    { timestamps: true });
const PushnotificationModel = mongoose.model('pushnotifications', emailTemplateSchema);

export default PushnotificationModel;
