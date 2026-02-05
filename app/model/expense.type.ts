import mongoose, { Schema } from "mongoose";

const expenseTypeSchema = new Schema({
    name: { type: String, required: true },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
}, { timestamps: true });

const ExpenseTypes = mongoose.model('expensetypes', expenseTypeSchema);
export default ExpenseTypes;