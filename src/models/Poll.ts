//server/models/Poll.ts
import mongoose, { Schema, Types } from 'mongoose';

// Option type (not extending Document)
export interface IOption {
  _id?: Types.ObjectId; // Optional since Mongoose auto-generates it
  text: string;
  votes: number;
}

// Poll type
export interface IPoll {
  title: string;
  description?: string;
  options: IOption[];
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Option Schema
const OptionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  },
  { _id: true } // Ensure each option has its own ObjectId
);

// Poll Schema
const PollSchema = new Schema<IPoll>(
  {
    title: { type: String, required: true },
    description: { type: String },
    options: [OptionSchema],
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Create and export the model
export const PollModel = mongoose.model<IPoll>('Poll', PollSchema);
