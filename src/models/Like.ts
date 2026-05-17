import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  productId: mongoose.Types.ObjectId;
  sessionId: string;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sessionId: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index: one like per session per product
LikeSchema.index({ productId: 1, sessionId: 1 }, { unique: true });
LikeSchema.index({ productId: 1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Like) {
  delete mongoose.models.Like;
}

export default mongoose.model<ILike>('Like', LikeSchema);
