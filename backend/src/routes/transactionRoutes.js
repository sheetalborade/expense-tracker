const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', transactionController.getAll);
router.get('/export/csv', transactionController.exportCsv);
router.post('/', transactionController.create);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
