const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String },
  oldValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
  // Extended fields for internal use
  resourceType: { type: String },
  resourceId: { type: mongoose.Schema.Types.ObjectId }
}, {
  collection: 'user_logs'
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
