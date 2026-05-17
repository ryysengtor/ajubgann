import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'transaction' | 'flash_sale' | 'coupon' | 'system';
  title: string;
  message: string;
  targetSession: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['transaction', 'flash_sale', 'coupon', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetSession: { type: String, default: '' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ targetSession: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotification>('Notification', NotificationSchema);
