const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  resultText: { type: String },
  resultNumeric: { type: Number },
  unit: { type: String },
  normalRange: { type: String },
  attachmentUrl: { type: String },
}, { _id: false });

const labRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tests: [{
    type: String,
    required: true,
  }],
  priority: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  isCritical: {
    type: Boolean,
    default: false,
  },
  results: [labResultSchema],
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const LabRequest = mongoose.model('LabRequest', labRequestSchema);

module.exports = LabRequest;
