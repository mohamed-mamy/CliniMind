const Invoice = require('../billing/invoice.model');
const Expense = require('../expense/expense.model');
const Appointment = require('../appointment/appointment.model');
const LabRequest = require('../lab/labRequest.model');

const getFinancialReport = async ({ from, to }) => {
  const invoiceMatch = {};
  const expenseMatch = {};

  if (from || to) {
    invoiceMatch.createdAt = {};
    expenseMatch.date = {};
    if (from) {
      invoiceMatch.createdAt.$gte = new Date(from);
      expenseMatch.date.$gte = new Date(from);
    }
    if (to) {
      invoiceMatch.createdAt.$lte = new Date(to);
      expenseMatch.date.$lte = new Date(to);
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

  const invoicesByCategory = await Invoice.aggregate([
    { $match: invoiceMatch },
    { $unwind: "$items" },
    { $group: { _id: "$items.type", total: { $sum: "$items.total" } } }
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

  // Assuming top diagnoses isn't directly stored in Appointment MVP model,
  // we'll leave it empty or mock it as we can't extract it easily without ICD-10 codes.
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

  // Count critical results
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

module.exports = {
  getFinancialReport,
  getMedicalReport
};
