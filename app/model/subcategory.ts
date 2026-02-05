import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory extends Document {
  category: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  images: [
    {
      docName: { type: String };
      docPath: { type: String };
      originalName: { type: String };
    }
  ];
  tags: string;
  featured_category: boolean;
  metaKeywords: string;
  metaTitle?: string;
  metaDescription?: string;
  displayOrder: number;
  status: boolean;
  isDelete: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
}

const SubcategorySchema: Schema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    images: [
      {
        docName: { type: String },
        docPath: { type: String },
        originalName: { type: String },
      },
    ],
    tags: { type: String, default: "" },
    featuredCategory: { type: Boolean, default: false },
    metaKeywords: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    // createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    // modifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    isDelete: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISubcategory>("Subcategory", SubcategorySchema);
