import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  cashifyTransactionId: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp: string;
  originalAmount: number;
  totalAmount: number;
  uniqueNominal: number;
  status: 'pending' | 'paid' | 'success' | 'expired' | 'cancel';
  qrString?: string;
  qrImageUrl?: string;
  expiredAt: Date;
  paidAt?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    cashifyTransactionId: { type: String, default: '' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerWhatsapp: { type: String, default: '' },
    originalAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    uniqueNominal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'success', 'expired', 'cancel'],
      default: 'pending',
    },
    qrString: { type: String, default: '' },
    qrImageUrl: { type: String, default: '' },
    expiredAt: { type: Date, required: true },
    paidAt: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true }
);

TransactionSchema.index({ status: 1 });
TransactionSchema.index({ customerPhone: 1 });
TransactionSchema.index({ customerWhatsapp: 1 });
TransactionSchema.index({ createdAt: -1 });

// Delete existing model to force schema recompilation in dev
if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
