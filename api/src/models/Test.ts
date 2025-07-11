import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
  name: string;
  description?: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number; // in milliseconds
  errorMessage?: string;
  testData?: any; // Store test configuration or data
  tags: string[];
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>({
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    maxlength: [200, 'Test name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Test description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['unit', 'integration', 'e2e', 'manual'],
    required: [true, 'Test type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'passed', 'failed', 'skipped'],
    default: 'pending'
  },
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  errorMessage: {
    type: String,
    maxlength: [2000, 'Error message cannot exceed 2000 characters']
  },
  testData: {
    type: Schema.Types.Mixed
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }
}, {
  timestamps: true
});

// Index for better query performance
testSchema.index({ userId: 1, status: 1 });
testSchema.index({ userId: 1, type: 1 });
testSchema.index({ taskId: 1 });
testSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITest>('Test', testSchema); 