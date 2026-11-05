const categoryService = require('../services/categoryService');
const { categorySchema } = require('../validators/categoryValidator');
const { success } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll(req.user.id, req.query.type);
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const getWithCounts = async (req, res, next) => {
  try {
    const type = req.query.type || 'expense';
    const categories = await categoryService.getWithCounts(req.user.id, type);
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const cat = await categoryService.create(req.user.id, data);
    return success(res, cat, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const cat = await categoryService.update(req.user.id, parseInt(req.params.id, 10), data);
    return success(res, cat, 'Category updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await categoryService.remove(req.user.id, parseInt(req.params.id, 10));
    return success(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getWithCounts, create, update, remove };
