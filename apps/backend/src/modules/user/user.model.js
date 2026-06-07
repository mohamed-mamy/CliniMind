const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // plain text
  role: { type: String, required: true, enum: ['director', 'doctor', 'receptionist', 'lab_technician'] },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  resetCode: { type: String },
  resetCodeExpiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
