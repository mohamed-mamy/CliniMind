const express = require('express');
const router = express.Router();

const { validate } = require('../../middlewares/validate.middleware');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');

const labController = require('./lab.controller');
const { createLabRequestSchema, enterLabResultsSchema } = require('./lab.validation');

// Auth is required for all lab endpoints
router.use(requireAuth);

// Create lab request: director, doctor
router.post('/requests', 
  requireRoles(['director', 'doctor']), 
  validate(createLabRequestSchema), 
  labController.createLabRequest
);

// List lab requests: director, doctor, lab_technician
router.get('/requests', 
  requireRoles(['director', 'doctor', 'lab_technician']), 
  labController.listLabRequests
);

// Get pending lab requests: lab_technician
router.get('/requests/pending', 
  requireRoles(['lab_technician']), 
  labController.getPendingLabRequests
);

// Get lab request details: director, doctor, lab_technician
router.get('/requests/:id', 
  requireRoles(['director', 'doctor', 'lab_technician']), 
  labController.getLabRequestById
);

// Enter lab results: lab_technician ONLY
router.put('/requests/:id/results', 
  requireRoles(['lab_technician']), 
  validate(enterLabResultsSchema), 
  labController.enterLabResults
);

// Get critical results: director, doctor
router.get('/results/critical', 
  requireRoles(['director', 'doctor']), 
  labController.getCriticalResults
);

module.exports = router;
