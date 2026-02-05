import { Schema, model } from 'mongoose';


export interface ICart extends Document {
  products: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'products', required: true },
      quantity: { type: Number, required: true },
      attributes: {
        type: Object,
      },
      offerAmount: { type: Number, required: false },
      price: { type: Number, required: true, default: 0 }
    }
  ],
  subtotal: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
  userId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  guestUserId: { type: String, default: null },
}

const cartSchema = new Schema({
  products: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'products', required: true },
      quantity: { type: Number, required: true },
      attributes: { type: Object },
      offerAmount: { type: Number, required: false },
      price: { type: Number, required: true, default: 0 },
      mrpPrice: { type: Number, default: 0 },
      offerId: { type: Schema.Types.ObjectId, ref: 'offers', required: false, default: null },
      createdAt: { type: Date, default: Date.now() }
    }
  ],
  subtotal: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
  userId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  guestUserId: { type: String, default: null },
  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });

export const CartModel = model('Cart', cartSchema);
