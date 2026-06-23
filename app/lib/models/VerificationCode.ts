import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const VerificationCode = mongoose.models.VerificationCode || 
  mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
