import express from 'express';
import {
  createAccountProduct,
  getAccountProducts,
  getAccountProduct,
  getActiveAccountProducts,
  updateAccountProduct,
  toggleProductStatus,
  deleteAccountProduct,
  getProductStats
} from '../controllers/accountProductController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all products (with optional activeOnly filter)
router.get('/', getAccountProducts);

// Get only active products (public endpoint for customers)
router.get('/active', getActiveAccountProducts);

// Get single product
router.get('/:id', getAccountProduct);

// Get product statistics
router.get('/:id/stats', getProductStats);

// Create new product
router.post('/', createAccountProduct);

// Update product
router.put('/:id', updateAccountProduct);

// Toggle product status
router.patch('/:id/toggle-status', toggleProductStatus);

// Delete product
router.delete('/:id', deleteAccountProduct);

export default router;

