import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  lender: mongoose.Types.ObjectId;
  available: boolean;
}

const BookSchema = new Schema<IBook>({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: String,
  coverUrl: String,
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

export const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
