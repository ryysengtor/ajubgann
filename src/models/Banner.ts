import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  title: string;
  description: string;
  link: string;
  order: number;
  isActive: boolean;
  type: 'home' | 'product'; // home = homepage banner, product = per-category banner
  category: string; // category slug for product banners
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    imageUrl: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ['home', 'product'], default: 'home' },
    category: { type: String, default: '' }, // category slug for product banners
  },
  { timestamps: true }
);

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Banner) {
  delete mongoose.models.Banner;
}

export default mongoose.model<IBanner>('Banner', BannerSchema);
