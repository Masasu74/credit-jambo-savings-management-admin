import express from 'express';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { uploadToCloudinary } from '../middleware/cloudinaryUpload.js';
// import Loan from '../models/loanModel.js'; // Removed for savings management system
import {
  addCustomer,
  listCustomers,
  getCustomerById,
  removeCustomer,
  updateCustomer,
  getCustomerDeletionPreview,
  addAdditionalFiles,
  removeAdditionalFile,
  resetCustomerPassword
} from '../controllers/customerController.js';

const customerRouter = express.Router();

// ✅ Customer routes
customerRouter.post(
  '/add',
  authMiddleware,
  authorize(['support', 'loan-officer', 'branch-manager', 'manager', 'admin']),
  uploadToCloudinary('files', 10, { folder: 'customers' }),
  addCustomer
);
customerRouter.put('/:id', authMiddleware, authorize(['support', 'loan-officer', 'branch-manager', 'manager', 'admin']), uploadToCloudinary('files', 10, { folder: 'customers' }), updateCustomer);

customerRouter.get(
  '/:id/deletion-preview',
  authMiddleware,
  authorize(['admin', 'manager']),
  getCustomerDeletionPreview
);

customerRouter.delete('/:id', authMiddleware, authorize(['admin', 'manager']), removeCustomer);
customerRouter.get(
  '/list',
  authMiddleware,
  authorize(['support','auditor','reporting','accountant','loan-officer','collections-officer','branch-manager','manager','admin']),
  cacheMiddleware(30 * 1000), // Reduced to 30 seconds for more responsive updates
  listCustomers
);
customerRouter.get(
  '/:id',
  authMiddleware,
  authorize(['support','auditor','reporting','accountant','loan-officer','collections-officer','branch-manager','manager','admin']),
  cacheMiddleware(1 * 60 * 1000),
  getCustomerById
); // Cache for 1 minute

// ✅ Get loans for a specific customer
customerRouter.get('/:id/loans', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const loans = await Loan.find({ customer: req.params.id })
      .populate('customer', 'personalInfo.fullName')
      .populate('createdBy', 'fullName')
      .populate('product', 'name productCode category')
      .lean();
    res.json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add additional files to customer
customerRouter.post(
  '/:customerId/files',
  authMiddleware,
  authorize(['support', 'loan-officer', 'branch-manager', 'manager', 'admin']),
  uploadToCloudinary('files', 10, { folder: 'customers' }),
  addAdditionalFiles
);

// Remove additional file from customer
customerRouter.delete(
  '/:customerId/files/:fileId',
  authMiddleware,
  authorize(['support', 'loan-officer', 'branch-manager', 'manager', 'admin']),
  removeAdditionalFile
);

// Reset customer password (admin only)
customerRouter.post(
  '/:customerId/reset-password',
  authMiddleware,
  authorize(['admin', 'manager']),
  resetCustomerPassword
);

export default customerRouter;
