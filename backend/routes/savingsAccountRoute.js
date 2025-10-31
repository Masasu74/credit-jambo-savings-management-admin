import express from 'express';
import {
  createSavingsAccount,
  getSavingsAccounts,
  getSavingsAccountById,
  getSavingsAccountByCustomer,
  updateSavingsAccount,
  verifySavingsAccount,
  getAccountTransactionHistory,
  getLowBalanceAccounts,
  getSavingsAccountStats,
  getCustomerAccountSummary,
  deleteSavingsAccount,
  createCustomerSavingsAccount,
  getMySavingsAccounts
} from '../controllers/savingsAccountController.js';
import auth from '../middleware/auth.js';
import customerAuth from '../middleware/customerAuth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create savings account (admin only)
router.post('/', authorize(['admin', 'manager']), createSavingsAccount);

// Get all savings accounts with pagination and filters
router.get('/', authorize(['admin', 'manager', 'staff']), getSavingsAccounts);

// Get savings account by ID
router.get('/:id', authorize(['admin', 'manager', 'staff']), getSavingsAccountById);

// Get savings account by customer ID
router.get('/customer/:customerId', authorize(['admin', 'manager', 'staff']), getSavingsAccountByCustomer);

// Update savings account
router.put('/:id', authorize(['admin', 'manager']), updateSavingsAccount);

// Delete savings account (admin/manager)
router.delete('/:id', authorize(['admin', 'manager']), deleteSavingsAccount);

// Verify savings account (admin only)
router.patch('/:id/verify', authorize(['admin']), verifySavingsAccount);

// Get account transaction history
router.get('/:id/transactions', authorize(['admin', 'manager', 'staff']), getAccountTransactionHistory);

// Get low balance accounts
router.get('/reports/low-balance', authorize(['admin', 'manager', 'staff']), getLowBalanceAccounts);

// Get savings account statistics
router.get('/stats/overview', authorize(['admin', 'manager', 'staff']), getSavingsAccountStats);

// Get customer account summary
router.get('/customer/:customerId/summary', authorize(['admin', 'manager', 'staff']), getCustomerAccountSummary);

export default router;

// Customer self-service savings accounts
export const createCustomerSavingsRouter = () => {
  const customerRouter = express.Router();
  customerRouter.use(customerAuth);
  customerRouter.post('/', createCustomerSavingsAccount);
  customerRouter.get('/mine', getMySavingsAccounts);
  return customerRouter;
};
