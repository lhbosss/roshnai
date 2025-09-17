import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionStatus =
  | 'pending'
  | 'negotiating'
  | 'payment_pending'
  | 'escrow'
  | 'book_delivered'
  | 'book_received'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface ITransaction extends Document {
  book: mongoose.Types.ObjectId;
  lender: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  rentalPrice: number;
  platformCommission: number;
  status: TransactionStatus;
  paymentConfirmed: boolean;
  lenderConfirmed: boolean;
  borrowerConfirmed: boolean;
  complaint?: mongoose.Types.ObjectId;
}

const TransactionSchema = new Schema<ITransaction>({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rentalPrice: { type: Number, required: true },
  platformCommission: { type: Number, required: true },
  status: { type: String, enum: ['pending','negotiating','payment_pending','escrow','book_delivered','book_received','completed','cancelled','disputed'], default: 'pending' },
  paymentConfirmed: { type: Boolean, default: false },
  lenderConfirmed: { type: Boolean, default: false },
  borrowerConfirmed: { type: Boolean, default: false },
  complaint: { type: Schema.Types.ObjectId, ref: 'Complaint' }
}, { timestamps: true });

export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
