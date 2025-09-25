import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessageAttachment {
  type: 'image' | 'document';
  filename: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface IMessage extends Document {
  transaction: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'suggest_price' | 'accept_offer' | 'system' | 'template';
  templateId?: string;
  attachments?: IMessageAttachment[];
  isRead: boolean;
  readAt?: Date;
  deliveredAt?: Date;
  priority: 'low' | 'normal' | 'high';
  relatedTo?: {
    type: 'confirmation' | 'payment' | 'pickup' | 'return' | 'condition_report';
    id?: string;
  };
}

const AttachmentSchema = new Schema<IMessageAttachment>({
  type: { type: String, enum: ['image', 'document'], required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const MessageSchema = new Schema<IMessage>({
  transaction: { type: Schema.Types.ObjectId, ref: 'EscrowTransaction', required: true },
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['text', 'suggest_price', 'accept_offer', 'system', 'template'], 
    default: 'text' 
  },
  templateId: { type: String },
  attachments: [AttachmentSchema],
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  deliveredAt: { type: Date, default: Date.now },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  relatedTo: {
    type: { type: String, enum: ['confirmation', 'payment', 'pickup', 'return', 'condition_report'] },
    id: { type: String }
  }
}, { timestamps: true });

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
