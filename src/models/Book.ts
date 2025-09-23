import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  description?: string;
  summary?: string;
  coverUrl?: string;
  images?: string[];
  lender: mongoose.Types.ObjectId;
  available: boolean;
  rentalFee: number;
  securityDeposit: number;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category?: string;
  isbn?: string;
  publishedYear?: number;
  language?: string;
  rentalDuration: number; // in days
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: String,
  summary: String,
  coverUrl: String,
  images: [String],
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  available: { type: Boolean, default: true },
  rentalFee: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },
  condition: { 
    type: String, 
    enum: ['new', 'like-new', 'good', 'fair', 'poor'], 
    required: true 
  },
  category: String,
  isbn: String,
  publishedYear: { type: Number, min: 1000, max: new Date().getFullYear() + 1 },
  language: { type: String, default: 'English' },
  rentalDuration: { type: Number, required: true, min: 1, max: 365 }, // days
  location: String
}, { timestamps: true });

export const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
