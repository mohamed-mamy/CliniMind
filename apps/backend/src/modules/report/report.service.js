const Invoice = require('../billing/invoice.model');
const InvoiceItem = require('../billing/invoiceItem.model');
const Expense = require('../expense/expense.model');
const Appointment = require('../appointment/appointment.model');
const LabRequest = require('../lab/labRequest.model');

const getFinancialReport = async ({ from, to }) => {
  const invoiceMatch = {};
  const expenseMatch = {};
  const itemMatch = {};

  if (from || to) {
    invoiceMatch.createdAt = {};
    expenseMatch.date = {};
    itemMatch['invoice.createdAt'] = {};
    if (from) {
      invoiceMatch.createdAt.$gte = new Date(from);
      expenseMatch.date.$gte = new Date(from);
      itemMatch['invoice.createdAt'].$gte = new Date(from);
    }
    if (to) {
      invoiceMatch.createdAt.$lte = new Date(to);
      expenseMatch.date.$lte = new Date(to);
      itemMatch['invoice.createdAt'].$lte = new Date(to);
    }
  }

  // Aggregate Invoices
  const invoiceStats = await Invoice.aggregate([
    { $match: invoiceMatch },
    { $group: {
        _id: null,
        totalRevenue: { $sum: "$paidAmount" },
        unpaidInvoicesAmount: { $sum: "$remainingAmount" }
      }
    }
  ]);

  // Aggregate by category using InvoiceItem joined with Invoice
  const invoicesByCategory = await InvoiceItem.aggregate([
    { $lookup: { from: 'invoices', localField: 'invoiceId', foreignField: '_id', as: 'invoice' } },
    { $unwind: '$invoice' },
    { $match: itemMatch },
    { $group: { _id: '$type', total: { $sum: '$total' } } }
  ]);

  const byCategory = {};
  invoicesByCategory.forEach(i => {
    byCategory[i._id] = i.total;
  });

  // Aggregate Expenses
  const expenseStats = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);

  const expenseGrouped = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: "$category", total: { $sum: "$amount" } } }
  ]);

  const expensesByCategory = {};
  expenseGrouped.forEach(e => {
    expensesByCategory[e._id] = e.total;
  });

  const totalRevenue = invoiceStats[0]?.totalRevenue || 0;
  const totalExpenses = expenseStats[0]?.totalExpenses || 0;
  const unpaidInvoices = invoiceStats[0]?.unpaidInvoicesAmount || 0;

  return {
    period: { from, to },
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    byCategory,
    expensesByCategory,
    unpaidInvoices
  };
};

const getMedicalReport = async ({ from, to }) => {
  const matchObj = {};
  const labMatchObj = {};

  if (from || to) {
    matchObj.createdAt = {};
    labMatchObj.requestedAt = {};
    if (from) {
      matchObj.createdAt.$gte = new Date(from);
      labMatchObj.requestedAt.$gte = new Date(from);
    }
    if (to) {
      matchObj.createdAt.$lte = new Date(to);
      labMatchObj.requestedAt.$lte = new Date(to);
    }
  }

  const apptStats = await Appointment.aggregate([
    { $match: matchObj },
    { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  let totalAppointments = 0;
  let completedAppointments = 0;
  let cancelledAppointments = 0;
  let noShowCount = 0;

  apptStats.forEach(s => {
    totalAppointments += s.count;
    if (s._id === 'completed') completedAppointments = s.count;
    if (s._id === 'cancelled') cancelledAppointments = s.count;
    if (s._id === 'no_show') noShowCount = s.count;
  });

  const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0;

  const topDiagnoses = [];

  const labReqStats = await LabRequest.aggregate([
    { $match: labMatchObj },
    { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  let totalLab = 0;
  let completedLab = 0;
  labReqStats.forEach(s => {
    totalLab += s.count;
    if (s._id === 'completed') completedLab = s.count;
  });

  const resultMatch = { isCritical: true };
  if (from || to) {
    resultMatch.requestedAt = {};
    if (from) resultMatch.requestedAt.$gte = new Date(from);
    if (to) resultMatch.requestedAt.$lte = new Date(to);
  }

  const criticalResultsCount = await LabRequest.countDocuments(resultMatch);

  return {
    period: { from, to },
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowRate,
    topDiagnoses,
    labRequests: {
      total: totalLab,
      completed: completedLab,
      criticalResults: criticalResultsCount
    }
  };
};

const getRevenueTrends = async (days = 7) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);

  const trends = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ['paid', 'partial'] } } },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$paidAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill missing days with zero
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = trends.find(t => t._id === key);
    result.push({
      date: key,
      revenue: found?.revenue || 0,
      count: found?.count || 0
    });
  }

  return { trends: result, totalRevenue: result.reduce((s, r) => s + r.revenue, 0) };
};

module.exports = {
  getFinancialReport,
  getMedicalReport,
  getRevenueTrends
};