const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  createInvoiceSchema,
  recordPaymentSchema
} = require('./billing.validation');

router.post(
  '/',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  validate(createInvoiceSchema),
  billingController.createInvoice
);

router.get(
  '/',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  billingController.listInvoices
);

router.get(
  '/:id',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  billingController.getInvoiceById
);

router.post(
  '/:id/payment',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  validate(recordPaymentSchema),
  billingController.recordPayment
);

router.get(
  '/:id/pdf',
  requireAuth,
  requireRoles(['director', 'receptionist']),
  billingController.generateInvoicePdf
);

router.delete(
  '/:id',
  requireAuth,
  requireRoles(['director']), // Only director can delete
  billingController.deleteInvoice
);

module.exports = router;
