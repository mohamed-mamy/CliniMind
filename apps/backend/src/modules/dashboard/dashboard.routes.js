const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/director', requireRole('director'), dashboardController.getDirectorDashboard);
router.get('/doctor', requireRole('doctor'), dashboardController.getDoctorDashboard);
router.get('/receptionist', requireRole('receptionist'), dashboardController.getReceptionistDashboard);
router.get('/lab', requireRole('lab_technician'), dashboardController.getLabDashboard);

module.exports = router;
