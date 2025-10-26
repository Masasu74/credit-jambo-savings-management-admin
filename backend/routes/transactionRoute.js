import express from 'express';
import {
  processDeposit,
  processWithdrawal,
  getTransactionById,
  getTransactions,
  getAccountTransactionHistory,
  getCustomerTransactionSummary,
  getDailyTransactionReport,
  getTransactionStats,
  cancelTransaction
} from '../controllers/transactionController.js';
import auth from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Process deposit transaction
router.post('/deposit', authorize(['admin', 'manager', 'staff']), processDeposit);

// Process withdrawal transaction
router.post('/withdrawal', authorize(['admin', 'manager', 'staff']), processWithdrawal);

// Get transaction by ID
router.get('/:id', authorize(['admin', 'manager', 'staff']), getTransactionById);

// Get all transactions with pagination and filters
router.get('/', authorize(['admin', 'manager', 'staff']), getTransactions);

// Get account transaction history
router.get('/account/:accountId', authorize(['admin', 'manager', 'staff']), getAccountTransactionHistory);

// Get customer transaction summary
router.get('/customer/:customerId/summary', authorize(['admin', 'manager', 'staff']), getCustomerTransactionSummary);

// Get daily transaction report
router.get('/reports/daily/:date', authorize(['admin', 'manager', 'staff']), getDailyTransactionReport);

// Get transaction statistics
router.get('/stats/overview', authorize(['admin', 'manager', 'staff']), getTransactionStats);

// Cancel transaction (admin only)
router.patch('/:id/cancel', authorize(['admin']), cancelTransaction);

export default router;
