import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  sessionId: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sessionId: { type: String, required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ productId: 1, sessionId: 1 }, { unique: true });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

export default mongoose.model<IReview>('Review', ReviewSchema);
