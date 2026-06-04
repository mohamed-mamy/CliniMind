const mongoose = require('mongoose');

const prescriptionDrugSchema = new mongoose.Schema({
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true,
    index: true,
  },
  drugName: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  instructions: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const PrescriptionDrug = mongoose.model('PrescriptionDrug', prescriptionDrugSchema);

module.exports = PrescriptionDrug;
