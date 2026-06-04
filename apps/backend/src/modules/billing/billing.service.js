const mongoose = require('mongoose');
const Invoice = require('./invoice.model');
const InvoiceItem = require('./invoiceItem.model');
const Patient = require('../patient/patient.model');
const Counter = require('../../models/counter.model');
const AuditLog = require('../audit/audit.model');
const pdfGenerator = require('../../utils/pdfGenerator');

class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function getNextInvoiceNumber() {
  const counter = await Counter.findByIdAndUpdate(
    'invoiceNumber',
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
}

exports.createInvoice = async (data, currentUser) => {
  const patient = await Patient.findById(data.patientId);
  if (!patient) {
    throw new AppError('Patient not found', 'NOT_FOUND', 404);
  }

  if (data.discountValue > 0 && currentUser.role !== 'director') {
    throw new AppError('Only directors can authorize discounts', 'DISCOUNT_NOT_AUTHORIZED', 403);
  }

  let totalAmount = 0;
  const items = data.items.map(item => {
    const total = item.quantity * item.unitPrice;
    totalAmount += total;
    return {
      ...item,
      total
    };
  });

  let discountAmount = 0;
  if (data.discountValue > 0) {
    if (data.discountType === 'percentage') {
      discountAmount = Math.floor(totalAmount * (data.discountValue / 100));
    } else if (data.discountType === 'fixed') {
      discountAmount = data.discountValue;
    }
  }

  totalAmount = Math.max(0, totalAmount - discountAmount);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      patientId: patient._id,
      patientName: patient.fullName,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountAuthorizedBy: data.discountValue > 0 ? currentUser.userId : undefined,
      status: 'unpaid',
      createdBy: currentUser.userId
    });

    await invoice.save({ session });

    const invoiceItems = items.map(item => ({
      ...item,
      invoiceId: invoice._id
    }));

    await InvoiceItem.insertMany(invoiceItems, { session });

    await AuditLog.create([{
      userId: currentUser.userId,
      action: 'create_invoice',
      details: `Created invoice #${invoiceNumber} for ${patient.fullName}`,
      newValues: invoice.toObject(),
      resourceType: 'Invoice',
      resourceId: invoice._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedItems = await InvoiceItem.find({ invoiceId: invoice._id }).lean();
    return {
      ...invoice.toObject(),
      items: populatedItems
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

exports.listInvoices = async (query, currentUser) => {
  const { page, limit, from, to, patientId, status } = query;
  const filter = {};

  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter)
  ]);

  return { data, meta: { page, limit, total } };
};

exports.getInvoiceById = async (id) => {
  const invoice = await Invoice.findById(id).lean();
  if (!invoice) {
    throw new AppError('Invoice not found', 'NOT_FOUND', 404);
  }

  const items = await InvoiceItem.find({ invoiceId: invoice._id }).lean();
  return { ...invoice, items };
};

exports.recordPayment = async (invoiceId, paymentData, currentUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      throw new AppError('Invoice not found', 'NOT_FOUND', 404);
    }

    if (invoice.status === 'paid') {
      throw new AppError('Invoice is already paid', 'INVALID_STATE', 409);
    }

    if (paymentData.amount > invoice.remainingAmount) {
      throw new AppError('Payment amount exceeds remaining amount', 'VALIDATION_ERROR', 422);
    }

    const oldValues = invoice.toObject();

    // Use findOneAndUpdate for atomic money updates (AGENTS.md rule)
    const newPaidAmount = invoice.paidAmount + paymentData.amount;
    const newRemainingAmount = invoice.totalAmount - newPaidAmount;
    const newStatus = newRemainingAmount === 0 ? 'paid' : 'partial';

    const updateData = {
      $inc: { paidAmount: paymentData.amount },
      $set: {
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paymentMethod: paymentData.paymentMethod
      }
    };
    if (newStatus === 'paid') {
      updateData.$set.paidAt = new Date();
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      updateData,
      { new: true, session }
    ).lean();

    await AuditLog.create([{
      userId: currentUser.userId,
      action: 'record_payment',
      details: `Recorded payment of ${paymentData.amount} for invoice #${updatedInvoice.invoiceNumber}`,
      oldValues,
      newValues: updatedInvoice,
      resourceType: 'Invoice',
      resourceId: updatedInvoice._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return {
      invoice: updatedInvoice,
      remainingAmount: updatedInvoice.remainingAmount
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

exports.deleteInvoice = async (invoiceId, currentUser) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError('Invoice not found', 'NOT_FOUND', 404);
  }

  if (invoice.paidAmount > 0) {
    throw new AppError('Cannot delete invoice with recorded payments', 'INVALID_STATE', 409);
  }

  const oldValues = invoice.toObject();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await InvoiceItem.deleteMany({ invoiceId: invoice._id }, { session });
    await Invoice.findByIdAndDelete(invoice._id, { session });

    await AuditLog.create([{
      userId: currentUser.userId,
      action: 'delete_invoice',
      details: `Deleted invoice #${invoice.invoiceNumber}`,
      oldValues,
      resourceType: 'Invoice',
      resourceId: invoice._id
    }], { session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

exports.generateInvoicePdf = async (invoiceId) => {
  const invoice = await exports.getInvoiceById(invoiceId);
  return pdfGenerator.createInvoicePdf(invoice);
};
