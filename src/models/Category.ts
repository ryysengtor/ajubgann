import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  order: number;
  isActive: boolean;
  // Theme fields for per-game styling
  accentColor: string;
  bgColor: string;
  bannerColor: string;
  glowColor: string;
  borderColor: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: '🎮' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // Per-game theme
    accentColor: { type: String, default: '#ff2d2d' },
    bgColor: { type: String, default: '#170000' },
    bannerColor: { type: String, default: '#ff2d2d' },
    glowColor: { type: String, default: 'rgba(255,45,45,0.3)' },
    borderColor: { type: String, default: 'rgba(255,80,80,0.35)' },
    theme: { type: String, default: 'default' },
  },
  { timestamps: true }
);

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model<ICategory>('Category', CategorySchema);
