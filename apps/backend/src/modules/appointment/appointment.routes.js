const express = require('express');
const router = express.Router();
const appointmentController = require('./appointment.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema
} = require('./appointment.validation');

router.post(
  '/',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get(
  '/',
  requireAuth,
  requireRoles(['director', 'doctor', 'receptionist']),
  appointmentController.listAppointments
);

router.get(
  '/available-slots',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  appointmentController.getAvailableSlots
);

router.get(
  '/:id',
  requireAuth,
  requireRoles(['director', 'doctor', 'receptionist']),
  appointmentController.getAppointmentById
);

router.put(
  '/:id',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  validate(updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.put(
  '/:id/status',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  validate(updateAppointmentStatusSchema),
  appointmentController.updateAppointmentStatus
);

module.exports = router;
