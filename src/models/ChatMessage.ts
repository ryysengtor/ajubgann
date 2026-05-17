import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: string;
  sender: 'visitor' | 'admin';
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: { type: String, required: true },
    sender: {
      type: String,
      enum: ['visitor', 'admin'],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ sessionId: 1 });
ChatMessageSchema.index({ createdAt: 1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.ChatMessage) {
  delete mongoose.models.ChatMessage;
}

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
