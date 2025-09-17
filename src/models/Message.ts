import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  transaction: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'suggest_price' | 'accept_offer';
  isRead: boolean;
}

const MessageSchema = new Schema<IMessage>({
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  type: { type: String, enum: ['text','suggest_price','accept_offer'], default: 'text' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
