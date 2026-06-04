const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true, 
    enum: ['salary', 'rent', 'utilities', 'supplies', 'maintenance', 'other'] 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true, maxlength: 200 },
  date: { type: Date, required: true },
  receiptUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

expenseSchema.index({ date: 1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
