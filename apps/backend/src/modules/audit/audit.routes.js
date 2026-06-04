const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const auditController = require('./audit.controller');

const router = express.Router();

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional()
});

router.use(requireAuth);
router.use(requireRoles(['director']));

router.get('/', validate(querySchema, 'query'), auditController.getAuditLogs);

module.exports = router;
