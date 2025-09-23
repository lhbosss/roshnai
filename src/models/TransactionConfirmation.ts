import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransactionConfirmation extends Document {
  escrowTransaction: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userRole: 'borrower' | 'lender';
  action: 'borrowed' | 'lent' | 'returned' | 'received';
  confirmedAt: Date;
  photo?: string; // URL to confirmation photo (book condition, etc.)
  notes?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

const TransactionConfirmationSchema = new Schema<ITransactionConfirmation>({
  escrowTransaction: { 
    type: Schema.Types.ObjectId, 
    ref: 'EscrowTransaction', 
    required: true 
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { 
    type: String, 
    enum: ['borrower', 'lender'], 
    required: true 
  },
  action: { 
    type: String, 
    enum: ['borrowed', 'lent', 'returned', 'received'], 
    required: true 
  },
  confirmedAt: { type: Date, default: Date.now },
  photo: String,
  notes: String,
  ipAddress: String,
  deviceInfo: String
}, { timestamps: true });

// Indexes for performance
TransactionConfirmationSchema.index({ escrowTransaction: 1, userRole: 1 });
TransactionConfirmationSchema.index({ user: 1, action: 1 });

// Ensure unique confirmation per transaction per user role per action
TransactionConfirmationSchema.index(
  { escrowTransaction: 1, userRole: 1, action: 1 }, 
  { unique: true }
);

export const TransactionConfirmation: Model<ITransactionConfirmation> = 
  mongoose.models.TransactionConfirmation || 
  mongoose.model<ITransactionConfirmation>('TransactionConfirmation', TransactionConfirmationSchema);