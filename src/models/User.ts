import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  department: string;
  batch: string;
  role: 'borrower' | 'lender' | 'admin';
  rating?: number;
  transactionHistory: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 20, match: /^[a-z0-9_]+$/i },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  batch: { type: String, required: true },
  role: { type: String, enum: ['borrower', 'lender', 'admin'], default: 'borrower' },
  rating: { type: Number, default: 0 },
  transactionHistory: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
}, { timestamps: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
