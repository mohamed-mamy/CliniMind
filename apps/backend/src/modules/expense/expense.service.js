const Expense = require('./expense.model');

const createExpense = async (data, creatorId) => {
  const expense = new Expense({
    ...data,
    createdBy: creatorId
  });
  await expense.save();
  return expense;
};

const getExpenses = async ({ page = 1, limit = 20, from, to, category }) => {
  const query = {};
  if (category) query.category = category;
  
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Expense.countDocuments(query);
  const expenses = await Expense.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return { expenses, total: parseInt(total), page: parseInt(page), limit: parseInt(limit) };
};

const updateExpense = async (id, data) => {
  const expense = await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!expense) {
    const err = new Error('Expense not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return expense;
};

const deleteExpense = async (id) => {
  const expense = await Expense.findByIdAndDelete(id);
  // Idempotent operation: if not found, it does nothing and we just return success
  return !!expense;
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense
};
