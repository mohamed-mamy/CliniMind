const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validate.middleware');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');

const prescriptionController = require('./prescription.controller');
const { createPrescriptionSchema } = require('./prescription.validation');

// Auth is required for all prescription endpoints
router.use(requireAuth);

// Create prescription: director, doctor
router.post('', 
  requireRoles(['director', 'doctor']), 
  validate(createPrescriptionSchema), 
  prescriptionController.createPrescription
);

// Get prescription details: director, doctor
router.get('/:id', 
  requireRoles(['director', 'doctor']), 
  prescriptionController.getPrescriptionById
);

// Get prescription PDF: director, doctor
router.get('/:id/pdf', 
  requireRoles(['director', 'doctor']), 
  prescriptionController.getPrescriptionPdf
);

module.exports = router;
