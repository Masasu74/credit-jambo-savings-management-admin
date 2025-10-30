import jwt from 'jsonwebtoken';
import Customer from '../models/customerModel.js';

/**
 * Customer Authentication Middleware
 * Verifies JWT token and attaches customer info to request
 */
const customerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify this is a customer token
      if (decoded.type !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Invalid token type. Please use customer login.'
        });
      }

      // Get customer from database
      const customer = await Customer.findById(decoded.customerId)
        .select('-password');

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found. Please register again.'
        });
      }

      if (!customer.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account is disabled. Please contact your branch.'
        });
      }

      // Attach customer info to request
      req.customer = {
        customerId: customer._id,
        customerCode: customer.customerCode,
        fullName: customer.personalInfo.fullName,
        email: customer.contact.email,
        tenant: customer.tenant
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.'
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Customer auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

export default customerAuthMiddleware;

