import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  role: 'user' | 'assistant';
  content: string;
  chatId: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant'],
    },
    content: {
      type: String,
      required: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 如果模型已经存在，则使用已存在的模型；否则创建新模型
export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema); 