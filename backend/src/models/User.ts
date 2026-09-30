import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    userType: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true } 
);

export const User = model('User', userSchema);
