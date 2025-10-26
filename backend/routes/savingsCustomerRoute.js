import express from 'express';
import {
  registerCustomer,
  loginCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  toggleCustomerStatus,
  getCustomerStats,
  resetCustomerPassword,
  getCustomerProfile,
  updateCustomerProfile
} from '../controllers/savingsCustomerController.js';
import auth from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Customer profile routes (customer authentication required)
router.use('/profile', auth);
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);

// Admin routes (admin authentication required)
router.use(auth);

// Get all customers
router.get('/', authorize(['admin', 'manager', 'staff']), getCustomers);

// Get customer by ID
router.get('/:id', authorize(['admin', 'manager', 'staff']), getCustomerById);

// Update customer
router.put('/:id', authorize(['admin', 'manager']), updateCustomer);

// Toggle customer status
router.patch('/:id/status', authorize(['admin', 'manager']), toggleCustomerStatus);

// Reset customer password
router.patch('/:id/reset-password', authorize(['admin']), resetCustomerPassword);

// Get customer statistics
router.get('/stats/overview', authorize(['admin', 'manager', 'staff']), getCustomerStats);

export default router;
