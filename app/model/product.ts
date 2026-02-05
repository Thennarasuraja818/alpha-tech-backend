import { Schema, model } from "mongoose";

const productSchema = new Schema({
  productCode: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "categorys", required: true },
  subCategory: { type: Schema.Types.ObjectId, ref: "subcategories", required: true },
  childCategory: { type: Schema.Types.ObjectId, ref: "childcategories" },

  productName: { type: String, required: true },
  brand: { type: Schema.Types.ObjectId, required: true, ref: "brands" },
  shortDescription: { type: String, default: "" },
  slug: { type: String, unique: true, required: true },
  hsn: { type: String, default: "", required: true },

  productImage: [
    {
      docName: { type: String, required: true },
      docPath: { type: String, required: true },
      originalName: { type: String, required: true },
    }
  ],
  additionalImage: [
    {
      docName: { type: String, required: true },
      docPath: { type: String, required: true },
      originalName: { type: String, required: true },
    }
  ],

  lowStockAlert: { type: Boolean, default: false },
  tagAndLabel: { type: String, default: "" },
  refundable: { type: Boolean, default: false },
  productStatus: { type: Boolean, default: true },
  description: { type: String, default: "" },

  applicableForWholesale: { type: Boolean, default: false },
  wholesalerDiscount: { type: Number, default: 0 },
  wholesalerTax: { type: Number, default: 0 },

  applicableForCustomer: { type: Boolean, default: false },

  customerDiscount: { type: Number, default: 0 },
  customerTax: { type: Number, default: 0 },
  quantityPerPack: { type: Number, default: 1 },
  packingType: { type: String, default: "" },
  isIncentive: { type: Boolean, default: false },
  showToLineman: { type: Boolean, default: false },

  wholesalerAttribute: {
    attributeId: [{ type: Schema.Types.ObjectId, ref: "attributes" }],
    rowData: [{ type: Schema.Types.Mixed }],
  },
  customerAttribute: {
    attributeId: [{ type: Schema.Types.ObjectId, ref: "attributes" }],
    rowData: [{ type: Schema.Types.Mixed }],
  },

  metaTitle: { type: String, default: "" },
  metaKeyword: { type: String, default: "" },
  metaDesc: { type: String, default: "" },

  delivery: { type: String, default: "" },

  lowStockQuantity: { type: Number, default: 20 },

  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "admins", required: true },
  modifiedBy: { type: Schema.Types.ObjectId, ref: "admins", required: true }
}, { timestamps: true });

export const ProductModel = model("Product", productSchema);
