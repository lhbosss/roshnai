import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscrowTransaction extends Document {
  book: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  lender: mongoose.Types.ObjectId;
  totalAmount: number;
  rentalFee: number;
  securityDeposit: number;
  status: 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentId?: string; // Payment gateway transaction ID
  expiresAt: Date;
  borrowerConfirmed: boolean;
  lenderConfirmed: boolean;
  confirmedAt?: Date;
  completedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  notes?: string;
}

const EscrowTransactionSchema = new Schema<IEscrowTransaction>({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  rentalFee: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: { type: String, required: true },
  paymentId: String,
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  borrowerConfirmed: { type: Boolean, default: false },
  lenderConfirmed: { type: Boolean, default: false },
  confirmedAt: Date,
  completedAt: Date,
  refundedAt: Date,
  refundReason: String,
  notes: String
}, { timestamps: true });

// Index for performance
EscrowTransactionSchema.index({ book: 1, status: 1 });
EscrowTransactionSchema.index({ borrower: 1, status: 1 });
EscrowTransactionSchema.index({ lender: 1, status: 1 });
EscrowTransactionSchema.index({ expiresAt: 1 });

// Auto-expire pending transactions
EscrowTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EscrowTransaction: Model<IEscrowTransaction> = 
  mongoose.models.EscrowTransaction || 
  mongoose.model<IEscrowTransaction>('EscrowTransaction', EscrowTransactionSchema);