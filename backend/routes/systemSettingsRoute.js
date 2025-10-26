import express from 'express';

const router = express.Router();

// Get public system settings
router.get('/public', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        appName: 'Credit Jambo Savings Management',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
          savingsAccounts: true,
          transactions: true,
          deviceVerification: true,
          notifications: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message
    });
  }
});

export default router;
