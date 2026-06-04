const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const expenseController = require('./expense.controller');

const router = express.Router();

const categories = ['salary', 'rent', 'utilities', 'supplies', 'maintenance', 'other'];

const createExpenseSchema = z.object({
  category: z.enum(categories),
  amount: z.number().positive(),
  description: z.string().max(200),
  date: z.string().datetime(), // ISO 8601 string
  receiptUrl: z.string().url().optional()
});

const updateExpenseSchema = z.object({
  category: z.enum(categories).optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(200).optional(),
  date: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional()
});

router.use(requireAuth);
router.use(requireRoles(['director']));

router.post('/', validate(createExpenseSchema), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.put('/:id', validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
