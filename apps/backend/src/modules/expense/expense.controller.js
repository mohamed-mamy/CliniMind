const expenseService = require('./expense.service');
const { sendSuccess } = require('../../utils/apiResponse');

const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.user.userId);
    if (req.log) req.log.info({ action: 'create_expense', expenseId: expense._id, userId: req.user.userId });
    return sendSuccess(res, 201, expense);
  } catch (err) {
    next(err);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { expenses, ...meta } = await expenseService.getExpenses(req.query);
    return sendSuccess(res, 200, expenses, meta);
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    if (req.log) req.log.info({ action: 'update_expense', expenseId: expense._id, userId: req.user.userId });
    return sendSuccess(res, 200, expense);
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    if (req.log) req.log.info({ action: 'delete_expense', expenseId: req.params.id, userId: req.user.userId });
    return sendSuccess(res, 204);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense
};
