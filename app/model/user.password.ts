import mongoose, { Schema } from "mongoose";

const userPassword = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'users', required: true },
    token:{type:String,  required: true},
    isDelete:{type: Boolean, required: true, default:false},
    isActive:{type: Boolean, required: true, default:true},
    timestamps: {
          updatedAt: true, 
          createdAt: true
        }  
})

// Create the User model
const UserPassword = mongoose.model('userpasswords', userPassword);
// Export the User model
export default UserPassword;