import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashSale extends Document {
  title: string;
  description: string;
  productIds: mongoose.Types.ObjectId[];
  discountPercent: number;
  originalPrices: Map<string, number>;
  salePrices: Map<string, number>;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  bannerImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    discountPercent: { type: Number, required: true },
    originalPrices: { type: Map, of: Number, default: {} },
    salePrices: { type: Map, of: Number, default: {} },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    bannerImage: { type: String, default: '' },
  },
  { timestamps: true }
);

FlashSaleSchema.index({ isActive: 1 });
FlashSaleSchema.index({ startsAt: 1 });
FlashSaleSchema.index({ endsAt: 1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.FlashSale) {
  delete mongoose.models.FlashSale;
}

export default mongoose.model<IFlashSale>('FlashSale', FlashSaleSchema);
