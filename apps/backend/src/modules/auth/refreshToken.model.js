const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false }
}, { timestamps: true });

refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
