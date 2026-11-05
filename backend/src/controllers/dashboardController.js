const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const data = await dashboardService.getSummary(req.user.id, year, month);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getCategoryExpenses = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const data = await dashboardService.getCategoryExpenses(req.user.id, year, month);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const data = await dashboardService.getMonthlyTrends(req.user.id, year);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getRecent = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentTransactions(req.user.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCategoryExpenses, getMonthlyTrends, getRecent };
