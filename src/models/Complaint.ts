import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComplaint extends Document {
  transaction: mongoose.Types.ObjectId;
  complainant: mongoose.Types.ObjectId;
  against: mongoose.Types.ObjectId;
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  resolution?: string;
}

const ComplaintSchema = new Schema<IComplaint>({
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  complainant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  against: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open','resolved','rejected'], default: 'open' },
  resolution: { type: String, trim: true }
}, { timestamps: true });

export const Complaint: Model<IComplaint> = mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);
