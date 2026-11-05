const budgetService = require('../services/budgetService');
const { budgetSchema } = require('../validators/budgetValidator');
const { success } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const budgets = await budgetService.getAll(req.user.id);
    return success(res, budgets);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const body = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: req.body.category_id ? parseInt(req.body.category_id, 10) : null,
    };
    const data = budgetSchema.parse(body);
    const budget = await budgetService.create(req.user.id, data);
    return success(res, budget, 'Budget created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.amount !== undefined) body.amount = parseFloat(body.amount);
    if (body.category_id !== undefined)
      body.category_id = body.category_id ? parseInt(body.category_id, 10) : null;
    const data = budgetSchema.partial().parse(body);
    const budget = await budgetService.update(req.user.id, parseInt(req.params.id, 10), data);
    return success(res, budget, 'Budget updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await budgetService.remove(req.user.id, parseInt(req.params.id, 10));
    return success(res, null, 'Budget deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
