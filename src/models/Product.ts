import mongoose, { Schema, Document } from 'mongoose';

export interface ISpec {
  label: string;
  value: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId;
  description: string;
  images: string[];        // Product thumbnail photos - 1:1 aspect ratio
  detailImages: string[];  // Detail/banner photos - 2400x1080 aspect ratio
  specs: ISpec[];
  price: number;
  originalPrice?: number;
  views: number;
  likes: number;
  isActive: boolean;
  isFeatured: boolean;
  isSold: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SpecSchema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    detailImages: { type: [String], default: [] },
    specs: [SpecSchema],
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isSold: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isSold: 1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default mongoose.model<IProduct>('Product', ProductSchema);
