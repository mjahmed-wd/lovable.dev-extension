import mongoose, { Document, Schema } from 'mongoose';

export interface IConversationMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export interface IConversationData {
  userMessages?: Array<{ sender: 'user'; text: string; timestamp?: string }>;
  aiMessages?: Array<{ sender: 'ai'; text: string; timestamp?: string }>;
  mergedMessages: IConversationMessage[];
  url?: string;
  title?: string;
}

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  documentType: 'requirement' | 'specification' | 'plan' | 'documentation' | 'other';
  customPrompt?: string;
  url?: string;
  htmlContent?: string;
  conversationData?: IConversationData;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema({
  sender: { type: String, enum: ['user', 'ai'] },
  text: { type: String },
  timestamp: { type: String }
});

const UserMessageSchema = new Schema({
  sender: { type: String, enum: ['user'] },
  text: { type: String },
  timestamp: { type: String }
});

const AiMessageSchema = new Schema({
  sender: { type: String, enum: ['ai'] },
  text: { type: String },
  timestamp: { type: String }
});

const ConversationDataSchema = new Schema({
  userMessages: { type: [UserMessageSchema], default: [] },
  aiMessages: { type: [AiMessageSchema], default: [] },
  mergedMessages: { type: [ConversationMessageSchema], default: [] },
  url: { type: String },
  title: { type: String }
});

const DocumentSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  documentType: { 
    type: String, 
    enum: ['requirement', 'specification', 'plan', 'documentation', 'other'],
    required: true 
  },
  customPrompt: { type: String },
  url: { type: String },
  htmlContent: { type: String },
  conversationData: { type: ConversationDataSchema, required: false },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IDocument>('Document', DocumentSchema); 