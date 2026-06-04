const Appointment = require('../appointment/appointment.model');
const Invoice = require('../billing/invoice.model');
const Expense = require('../expense/expense.model');
const Patient = require('../patient/patient.model');
const Notification = require('../notification/notification.model');
const LabRequest = require('../lab/labRequest.model');

const startOfDay = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
};
const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0,0,0,0);
  return d;
};

const getDirectorDashboard = async (req, res, next) => {
  try {
    const today = startOfDay();
    const month = startOfMonth();

    const [
      appointmentsToday,
      monthlyInvoices,
      monthlyExpenses,
      pendingAppointments,
      totalPatients,
      unreadNotifications,
      recentAppointments,
      recentExpenses
    ] = await Promise.all([
      Appointment.find({ date: { $gte: today } }).lean(),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: month } } }, 
        { $group: { _id: null, total: { $sum: '$totalAmount' }, unpaid: { $sum: '$remainingAmount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: month } } }, 
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Appointment.countDocuments({ status: 'scheduled' }),
      Patient.countDocuments(),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
      Appointment.find().sort({ createdAt: -1 }).limit(5).lean(),
      Expense.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    // To calculate todayRevenue accurately we would need to sum invoices created today that are paid,
    // but we will use a basic aggregate placeholder here.
    const todayInvoices = await Invoice.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          todayRevenue: todayInvoices[0]?.total || 0,
          todayAppointments: appointmentsToday.length,
          monthlyRevenue: monthlyInvoices[0]?.total || 0,
          monthlyExpenses: monthlyExpenses[0]?.total || 0,
          monthlyProfit: (monthlyInvoices[0]?.total || 0) - (monthlyExpenses[0]?.total || 0),
          pendingAppointments,
          unpaidInvoices: monthlyInvoices[0]?.unpaid || 0,
          totalPatients,
          criticalResultsUnread: unreadNotifications
        },
        recentAppointments,
        recentExpenses,
        lowStockAlert: null // Pharmacy not in MVP
      },
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

const getDoctorDashboard = async (req, res, next) => {
  try {
    const today = startOfDay();
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          todayAppointments: await Appointment.countDocuments({ doctorId: req.user._id, date: { $gte: today } }),
          todayCompleted: await Appointment.countDocuments({ doctorId: req.user._id, date: { $gte: today }, status: 'completed' }),
          weekAppointments: await Appointment.countDocuments({ doctorId: req.user._id, date: { $gte: startOfMonth() } }), // Using month as proxy for now
          pendingLabResults: await LabRequest.countDocuments({ doctorId: req.user._id, status: 'pending' }),
          unreadNotifications: await Notification.countDocuments({ userId: req.user._id, isRead: false })
        },
        todayAgenda: await Appointment.find({ doctorId: req.user._id, date: { $gte: today } }).lean(),
        criticalResults: [], // Can query LabResult here when integrated
        recentPatients: []
      },
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

const getReceptionistDashboard = async (req, res, next) => {
  try {
    const today = startOfDay();
    
    const todayInvoices = await Invoice.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          todayAppointments: await Appointment.countDocuments({ date: { $gte: today } }),
          todayCheckedIn: await Appointment.countDocuments({ date: { $gte: today }, status: { $in: ['confirmed', 'completed'] } }),
          todayRevenue: todayInvoices[0]?.total || 0,
          waitingRoomCount: await Appointment.countDocuments({ date: { $gte: today }, status: 'confirmed' })
        },
        todayAgenda: await Appointment.find({ date: { $gte: today } }).lean(),
        recentInvoices: await Invoice.find().sort({ createdAt: -1 }).limit(5).lean()
      },
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

const getLabDashboard = async (req, res, next) => {
  try {
    const today = startOfDay();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          pendingRequests: await LabRequest.countDocuments({ status: 'pending' }),
          urgentRequests: await LabRequest.countDocuments({ status: 'pending', priority: 'urgent' }),
          completedToday: await LabRequest.countDocuments({ status: 'completed', completedAt: { $gte: today } })
        },
        pendingRequests: await LabRequest.find({ status: 'pending' }).sort({ priority: -1, requestedAt: 1 }).limit(10).lean(),
        recentCompleted: await LabRequest.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean()
      },
      error: null,
      meta: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDirectorDashboard,
  getDoctorDashboard,
  getReceptionistDashboard,
  getLabDashboard
};
