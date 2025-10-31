import express from 'express';
import mongoose from 'mongoose';
import {
  processDeposit,
  processWithdrawal,
  getTransactionById,
  getTransactions,
  getAccountTransactionHistory,
  getCustomerTransactionSummary,
  getDailyTransactionReport,
  getTransactionStats,
  cancelTransaction,
  getRecentTransactions,
  customerDeposit,
  customerWithdrawal
} from '../controllers/transactionController.js';
import Transaction from '../models/transactionModel.js';
import { transactionListDTO } from '../dtos/transactionDTO.js';
import auth from '../middleware/auth.js';
import customerAuth from '../middleware/customerAuth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Process deposit transaction
router.post('/deposit', authorize(['admin', 'manager', 'staff']), processDeposit);

// Process withdrawal transaction
router.post('/withdrawal', authorize(['admin', 'manager', 'staff']), processWithdrawal);

// Get recent transactions
router.get('/recent', authorize(['admin', 'manager', 'staff']), getRecentTransactions);

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

// Customer self-service transactions
export const createCustomerTransactionRouter = () => {
  const customerRouter = express.Router();
  customerRouter.use(customerAuth);
  customerRouter.post('/deposit', customerDeposit);
  customerRouter.post('/withdrawal', customerWithdrawal);
  // Customer analytics endpoints
  customerRouter.get('/account/:accountId', async (req, res) => {
    try {
      // Only allow customer to access their own account transactions
      const { accountId } = req.params;
      const account = await (await import('../models/savingsAccountModel.js')).default.findById(accountId);
      if (!account || String(account.customerId) !== String(req.customer.customerId)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      return getAccountTransactionHistory(req, res);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
  customerRouter.get('/summary', (req, res) => {
    // Set customerId from authenticated customer
    req.params.customerId = req.customer.customerId;
    return getCustomerTransactionSummary(req, res);
  });
  customerRouter.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const type = req.query.type;
      const accountId = req.query.accountId;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      const skip = (page - 1) * limit;
      
      // Ensure customerId is an ObjectId
      // customer._id is already an ObjectId from the middleware, but ensure it's valid
      let customerIdObj;
      if (req.customer && req.customer.customerId) {
        try {
          // If it's already an ObjectId, this will work fine
          customerIdObj = mongoose.Types.ObjectId.isValid(req.customer.customerId) 
            ? req.customer.customerId 
            : new mongoose.Types.ObjectId(req.customer.customerId);
        } catch (e) {
          console.error('Invalid customer ID format:', req.customer.customerId, e);
          return res.status(400).json({ success: false, message: 'Invalid customer ID' });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Customer not authenticated' });
      }

      const query = { customerId: customerIdObj };

      if (type) query.type = type;
      if (accountId) {
        try {
          query.accountId = new mongoose.Types.ObjectId(accountId);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid account ID' });
        }
      }

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const transactions = await Transaction.find(query)
        .populate({
          path: 'accountId',
          select: 'accountNumber accountType',
          options: { lean: true }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-processedBy -deviceId -ipAddress -userAgent')
        .lean();

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        data: transactionListDTO(transactions, {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        })
      });
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to fetch transactions',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  return customerRouter;
};
