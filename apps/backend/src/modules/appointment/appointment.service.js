const Appointment = require('./appointment.model');
const Patient = require('../patient/patient.model');
const User = require('../user/user.model');
const AuditLog = require('../audit/audit.model');
const Notification = require('../notification/notification.model');
const { emitNotification } = require('../../socket');

class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

exports.createAppointment = async (data, currentUser) => {
  // 1. Check if patient exists
  const patient = await Patient.findById(data.patientId);
  if (!patient) {
    throw new AppError('Patient not found', 'NOT_FOUND', 404);
  }

  // 2. Check if doctor exists and has role 'doctor'
  const doctor = await User.findById(data.doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new AppError('Doctor not found', 'NOT_FOUND', 404);
  }

  // 3. Conflict check
  const startOfDay = new Date(data.date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const existing = await Appointment.findOne({
    doctorId: data.doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot: data.timeSlot
  });

  if (existing && !['cancelled', 'no_show'].includes(existing.status)) {
    throw new AppError('Time slot already booked for this doctor', 'CONFLICT', 409);
  }

  // 4. Create appointment
  const appointment = new Appointment({
    ...data,
    date: startOfDay, // Store date part only (time is in timeSlot)
    status: 'scheduled',
    createdBy: currentUser.userId
  });

  await appointment.save();

  // Log action
  await AuditLog.create({
    userId: currentUser.userId,
    action: 'create_appointment',
    details: `Created appointment for patient ${patient.fullName}`,
    newValues: appointment.toObject(),
    resourceType: 'Appointment',
    resourceId: appointment._id
  });

  // Create notification for the doctor (best-effort — don't fail the appointment)
  try {
    const notification = await Notification.create({
      userId: doctor._id,
      type: 'new_appointment',
      title: 'Nouveau rendez-vous',
      body: `Un nouveau rendez-vous a été planifié avec ${patient.fullName} le ${appointment.date.toLocaleDateString()} à ${appointment.timeSlot}.`,
      data: { appointmentId: appointment._id }
    });
    
    // Emit real-time socket event
    emitNotification(doctor._id, notification);
  } catch (notifErr) {
    console.error('[AppointmentService] Notification creation failed (non-fatal):', notifErr.message);
  }

  // Populate names for DTO
  const result = await Appointment.findById(appointment._id)
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName');

  return {
    ...result.toObject(),
    patientName: result.patientId.fullName,
    doctorName: result.doctorId.fullName,
    patientId: result.patientId._id,
    doctorId: result.doctorId._id
  };
};

exports.listAppointments = async (query, currentUser) => {
  const { doctorId, patientId, status } = query;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  let { from, to } = query;
  const filter = {};

  // Role-based filter
  if (currentUser.role === 'doctor') {
    filter.doctorId = currentUser.userId;
  } else if (currentUser.role === 'lab_technician') {
    throw new AppError('Access denied', 'FORBIDDEN', 403);
  } else {
    // director or receptionist
    if (doctorId) filter.doctorId = doctorId;
  }

  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;

  // Default to today if no date range provided
  if (!from && !to) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    filter.date = { $gte: today, $lt: tomorrow };
  } else {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'fullName')
      .populate('doctorId', 'fullName')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter)
  ]);

  const data = items.map(item => ({
    ...item,
    patientName: item.patientId?.fullName,
    doctorName: item.doctorId?.fullName,
    patientId: item.patientId?._id,
    doctorId: item.doctorId?._id
  }));

  return { data, meta: { page, limit, total } };
};

exports.getAppointmentById = async (id, currentUser) => {
  const appointment = await Appointment.findById(id)
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName')
    .lean();

  if (!appointment) {
    throw new AppError('Appointment not found', 'NOT_FOUND', 404);
  }

  if (currentUser.role === 'doctor' && appointment.doctorId._id.toString() !== currentUser.userId.toString()) {
    throw new AppError('Cannot access other doctor appointments', 'FORBIDDEN', 403);
  }

  return {
    ...appointment,
    patientName: appointment.patientId?.fullName,
    doctorName: appointment.doctorId?.fullName,
    patientId: appointment.patientId?._id,
    doctorId: appointment.doctorId?._id
  };
};

exports.updateAppointment = async (id, data, currentUser) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Appointment not found', 'NOT_FOUND', 404);
  }

  // Conflict check if time or doctor changes
  const newDoctorId = data.doctorId || appointment.doctorId;
  const newDate = data.date ? new Date(data.date) : appointment.date;
  if (data.date) {
    newDate.setUTCHours(0, 0, 0, 0);
  }
  const newTimeSlot = data.timeSlot || appointment.timeSlot;

  if (
    (data.doctorId && data.doctorId !== appointment.doctorId.toString()) ||
    (data.date && newDate.getTime() !== appointment.date.getTime()) ||
    (data.timeSlot && data.timeSlot !== appointment.timeSlot)
  ) {
    const startOfDay = new Date(newDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: newDoctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: newTimeSlot
    });

    if (existing && !['cancelled', 'no_show'].includes(existing.status)) {
      throw new AppError('Time slot already booked for this doctor', 'CONFLICT', 409);
    }
  }

  if (data.status) {
    const validTransitions = {
      'scheduled': ['confirmed', 'cancelled', 'no_show', 'completed'],
      'confirmed': ['completed', 'cancelled', 'no_show'],
      'completed': [],
      'cancelled': [],
      'no_show': []
    };
    if (appointment.status !== data.status && !validTransitions[appointment.status].includes(data.status)) {
      throw new AppError('Invalid status transition', 'INVALID_STATE', 409);
    }
  }

  const oldValues = appointment.toObject();

  Object.assign(appointment, data);
  if (data.date) {
    appointment.date = newDate;
  }

  await appointment.save();

  await AuditLog.create({
    userId: currentUser.userId,
    action: 'update_appointment',
    details: `Updated appointment ${appointment._id}`,
    oldValues,
    newValues: appointment.toObject(),
    resourceType: 'Appointment',
    resourceId: appointment._id
  });

  const result = await Appointment.findById(appointment._id)
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName')
    .lean();

  return {
    ...result,
    patientName: result.patientId?.fullName,
    doctorName: result.doctorId?.fullName,
    patientId: result.patientId?._id,
    doctorId: result.doctorId?._id
  };
};

exports.updateAppointmentStatus = async (id, status, currentUser) => {
  if (currentUser.role === 'doctor') {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 'NOT_FOUND', 404);
    }
    if (appointment.doctorId.toString() !== currentUser.userId.toString()) {
      throw new AppError('Cannot update another doctor\'s appointment', 'FORBIDDEN', 403);
    }
    if (status !== 'completed') {
      throw new AppError('Doctor can only mark appointments as completed', 'FORBIDDEN', 403);
    }
  }
  return exports.updateAppointment(id, { status }, currentUser);
};

exports.getAvailableSlots = async (doctorId, dateStr) => {
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new AppError('Doctor not found', 'NOT_FOUND', 404);
  }

  const searchDate = new Date(dateStr);
  searchDate.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(searchDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctorId,
    date: { $gte: searchDate, $lte: endOfDay },
    status: { $nin: ['cancelled', 'no_show'] }
  }).lean();

  const bookedSlots = appointments.map(a => a.timeSlot);

  // Generate slots (simplified: 08:00 to 17:00, 15 min intervals)
  // In a real app, this might come from clinic settings or doctor schedule.
  const allSlots = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hourStr = h.toString().padStart(2, '0');
      const minStr = m.toString().padStart(2, '0');
      allSlots.push(`${hourStr}:${minStr}`);
    }
  }

  const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

  return { availableSlots };
};
