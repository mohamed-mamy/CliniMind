const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  type: { type: String, enum: ['consultation', 'lab_test'], required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  referenceId: { type: mongoose.Schema.Types.ObjectId }
});

invoiceItemSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('InvoiceItem', invoiceItemSchema);
