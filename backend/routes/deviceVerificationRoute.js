import express from 'express';
import {
  registerDevice,
  verifyDevice,
  getPendingVerifications,
  getDeviceVerifications,
  getDeviceVerificationById,
  getCustomerDevices,
  checkDeviceVerification,
  recordDeviceLogin,
  getDeviceVerificationStats,
  suspendDevice,
  reactivateDevice,
  revokeCustomerDeviceVerification
} from '../controllers/deviceVerificationController.js';
import auth from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Register device (public route for customer registration)
router.post('/register', registerDevice);

// Check device verification (public route for login)
router.get('/check/:customerId/:deviceId', checkDeviceVerification);

// Record device login (public route for login tracking)
router.post('/login', recordDeviceLogin);

// All other routes require authentication
router.use(auth);

// Verify device (admin only)
router.patch('/:id/verify', authorize(['admin']), verifyDevice);

// Get pending device verifications
router.get('/pending', authorize(['admin', 'manager', 'staff']), getPendingVerifications);

// Get all device verifications with filters
router.get('/', authorize(['admin', 'manager', 'staff']), getDeviceVerifications);

// Get device verification by ID
router.get('/:id', authorize(['admin', 'manager', 'staff']), getDeviceVerificationById);

// Get customer devices
router.get('/customer/:customerId', authorize(['admin', 'manager', 'staff']), getCustomerDevices);

// Get device verification statistics
router.get('/stats/overview', authorize(['admin', 'manager', 'staff']), getDeviceVerificationStats);

// Suspend device (admin only)
router.patch('/:id/suspend', authorize(['admin']), suspendDevice);

// Reactivate device (admin only)
router.patch('/:id/reactivate', authorize(['admin']), reactivateDevice);

// Revoke device verification by customer ID (admin only)
router.patch('/revoke-customer/:customerId', authorize(['admin']), revokeCustomerDeviceVerification);

export default router;
