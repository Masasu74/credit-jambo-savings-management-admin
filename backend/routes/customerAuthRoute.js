import express from 'express';
import {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  getAvailableTenants,
  getBranchesByTenant
} from '../controllers/customerAuthController.js';
import customerAuthMiddleware from '../middleware/customerAuth.js';

const customerAuthRouter = express.Router();

// Public routes
customerAuthRouter.post('/register', registerCustomer);
customerAuthRouter.post('/login', loginCustomer);
customerAuthRouter.get('/tenants', getAvailableTenants);
customerAuthRouter.get('/branches', getBranchesByTenant);

// Protected routes
customerAuthRouter.get('/me', customerAuthMiddleware, getCurrentCustomer);

export default customerAuthRouter;

