const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const reportController = require('./report.controller');

const router = express.Router();

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['json', 'excel', 'pdf']).optional()
});

const exportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['json', 'excel', 'pdf', 'zip']).optional()
});

router.use(requireAuth);
router.use(requireRoles(['director']));

router.get('/financial', validate(querySchema, 'query'), reportController.getFinancialReport);
router.get('/medical', validate(querySchema, 'query'), reportController.getMedicalReport);
router.get('/export', validate(exportQuerySchema, 'query'), reportController.exportReports);

module.exports = router;
