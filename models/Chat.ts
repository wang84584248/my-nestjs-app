import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 如果模型已经存在，则使用已存在的模型；否则创建新模型
export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema); 