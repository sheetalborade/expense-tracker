const transactionService = require('../services/transactionService');
const notificationService = require('../services/notificationService');
const { transactionSchema, updateTransactionSchema } = require('../validators/transactionValidator');
const { success } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const data = transactionSchema.parse({
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id, 10),
    });
    const tx = await transactionService.create(req.user.id, data);
    // Fire-and-forget budget alerts
    notificationService.checkBudgetAlerts(req.user.id).catch(() => {});
    return success(res, tx, 'Transaction created', 201);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId, 10) : undefined,
      from: req.query.from,
      to: req.query.to,
      search: req.query.search,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sortBy: req.query.sortBy,
      order: req.query.order,
    };
    const result = await transactionService.getAll(req.user.id, filters);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const tx = await transactionService.getById(req.user.id, parseInt(req.params.id, 10));
    return success(res, tx);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.amount !== undefined) body.amount = parseFloat(body.amount);
    if (body.category_id !== undefined) body.category_id = parseInt(body.category_id, 10);
    const data = updateTransactionSchema.parse(body);
    const tx = await transactionService.update(req.user.id, parseInt(req.params.id, 10), data);
    return success(res, tx, 'Transaction updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await transactionService.remove(req.user.id, parseInt(req.params.id, 10));
    return success(res, null, 'Transaction deleted');
  } catch (err) {
    next(err);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId, 10) : undefined,
      from: req.query.from,
      to: req.query.to,
      search: req.query.search,
    };
    const rows = await transactionService.exportAll(req.user.id, filters);

    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = 'Date,Description,Category,Type,Amount,Payment Method,Notes';
    const lines = rows.map((r) =>
      [
        r.transaction_date,
        escape(r.description),
        escape(r.category_name),
        r.type,
        r.amount,
        escape(r.payment_method),
        escape(r.notes),
      ].join(',')
    );

    const csv = [header, ...lines].join('\n');
    const filename = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getById, update, remove, exportCsv };
