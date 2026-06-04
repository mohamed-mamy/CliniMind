const { z } = require('zod');

const createInvoiceSchema = z.object({
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  items: z.array(
    z.object({
      type: z.enum(['consultation', 'lab_test']),
      description: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().int().nonnegative(),
      referenceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional()
    })
  ).min(1, 'At least one item is required'),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().int().nonnegative().optional()
});

const recordPaymentSchema = z.object({
  amount: z.number().int().positive(),
  paymentMethod: z.enum(['cash', 'card', 'transfer'])
});

module.exports = {
  createInvoiceSchema,
  recordPaymentSchema
};
