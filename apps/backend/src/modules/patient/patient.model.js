const mongoose = require('mongoose');
const Counter = require('../../models/counter.model');

const allergySchema = new mongoose.Schema({
  type: { type: String, enum: ['medication', 'food', 'latex', 'other'], required: true },
  description: { type: String, required: true }
}, { _id: false });

const medicalHistorySchema = new mongoose.Schema({
  allergies: [allergySchema],
  chronicDiseases: [{ type: String }],
  surgeries: [{ type: String }],
  currentTreatments: [{ type: String }],
  familyHistory: { type: String },
  confidentialNotes: { type: String }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  fileNumber: { type: Number, unique: true },
  fullName: { type: String, required: true, trim: true },
  ageCategory: { 
    type: String, 
    enum: ["0-1 an", "1-5 ans", "6-12 ans", "13-18 ans", "19-35 ans", "36-50 ans", "51-65 ans", "65+ ans"],
    required: true 
  },
  gender: { type: String, enum: ['M', 'F'], required: true },
  bloodType: { type: String },
  phonePrimary: { type: String, required: true },
  phoneSecondary: { type: String },
  email: { type: String, lowercase: true, trim: true },
  medicalHistory: { type: medicalHistorySchema, default: () => ({}) },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

patientSchema.pre('save', async function() {
  if (this.isNew && !this.fileNumber) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'patientFile' },
      { $inc: { sequenceValue: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    this.fileNumber = counter.sequenceValue;
  }
});

patientSchema.index({ fullName: 1 });
patientSchema.index({ phonePrimary: 1 });

module.exports = mongoose.model('Patient', patientSchema);
