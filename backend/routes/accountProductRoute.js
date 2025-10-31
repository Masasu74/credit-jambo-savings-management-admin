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
import jwt from 'jsonwebtoken';

const router = express.Router();

// Get only active products (accessible to both customers and admins)
// This endpoint allows both customer and admin tokens
router.get('/active', async (req, res, next) => {
  try {
    // Check if there's an auth token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // If token is valid (either customer or admin), proceed
        // The token type doesn't matter for this read-only endpoint
        req.user = decoded; // Attach decoded token for potential use
      } catch (jwtError) {
        // Invalid token, but still allow access to active products (public info)
        // Continue without attaching user
      }
    }
    // Call the controller (works with or without auth)
    getActiveAccountProducts(req, res);
  } catch (error) {
    next(error);
  }
});

// All other routes require admin authentication
router.use(authMiddleware);

// Get all products (with optional activeOnly filter)
router.get('/', getAccountProducts);

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

