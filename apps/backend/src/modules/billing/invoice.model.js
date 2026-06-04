const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: Number, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number, default: 0 },
  discountAuthorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'] },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paidAt: { type: Date }
});

invoiceSchema.index({ patientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
