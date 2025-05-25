//server/models/Poll.ts
import mongoose, { Schema } from 'mongoose';
// Option Schema
const OptionSchema = new Schema({
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
}, { _id: true } // Ensure each option has its own ObjectId
);
// Poll Schema
const PollSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    options: [OptionSchema],
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true } // adds createdAt and updatedAt automatically
);
// Create and export the model
export const PollModel = mongoose.model('Poll', PollSchema);
