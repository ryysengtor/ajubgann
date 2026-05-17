import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitor extends Document {
  sessionId: string;
  page: string;
  referrer: string;
  userAgent: string;
  visitedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    sessionId: { type: String, required: true },
    page: { type: String, required: true },
    referrer: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    visitedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

VisitorSchema.index({ sessionId: 1 });
VisitorSchema.index({ visitedAt: 1 });
VisitorSchema.index({ page: 1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Visitor) {
  delete mongoose.models.Visitor;
}

export default mongoose.model<IVisitor>('Visitor', VisitorSchema);
