const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/category-expenses', dashboardController.getCategoryExpenses);
router.get('/monthly-trends', dashboardController.getMonthlyTrends);
router.get('/recent', dashboardController.getRecent);

module.exports = router;
