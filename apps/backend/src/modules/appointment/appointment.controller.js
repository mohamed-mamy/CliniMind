const appointmentService = require('./appointment.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

exports.createAppointment = async (req, res, next) => {
  try {
    const data = await appointmentService.createAppointment(req.body, req.user);
    return sendSuccess(res, 201, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.listAppointments = async (req, res, next) => {
  try {
    const { data, meta } = await appointmentService.listAppointments(req.query, req.user);
    return sendSuccess(res, 200, data, meta);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const data = await appointmentService.getAppointmentById(req.params.id, req.user);
    return sendSuccess(res, 200, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const data = await appointmentService.updateAppointment(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const data = await appointmentService.updateAppointmentStatus(req.params.id, req.body.status, req.user);
    return sendSuccess(res, 200, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const data = await appointmentService.getAvailableSlots(req.query.doctorId, req.query.date);
    return sendSuccess(res, 200, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};
