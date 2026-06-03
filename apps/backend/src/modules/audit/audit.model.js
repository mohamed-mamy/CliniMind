const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'user_logs'
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
