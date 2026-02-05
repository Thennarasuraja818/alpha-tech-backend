import { model } from "mongoose";

// Example: Mongoose schema (MongoDB + Node.js)
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  images: [
    {
      docName: { type: String, required: false },
      docPath: { type: String, required: false },
      originalName: { type: String, required: false },
    }
  ],
  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders',
    required: true
  },
}, {
  timestamps: true // adds createdAt and updatedAt fields
});


export const ReviewModel = model("reviews", reviewSchema);
