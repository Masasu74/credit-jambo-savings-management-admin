import Customer from '../models/customerModel.js';
import Branch from '../models/branchModel.js';
import InAppNotification from '../models/inAppNotificationModel.js';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { logActivity } from '../utils/logActivity.js';
import { generateCustomId } from '../utils/generateCustomId.js';

// Create JWT token
const createToken = (customerId) => {
  return jwt.sign({ customerId, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Customer Registration
export const registerCustomer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      branchId,
      tenant
    } = req.body;

    // Validate required fields (only basic fields for registration)
    if (!fullName || !email || !password || !phone || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ 'contact.email': email.toLowerCase() });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    // ID number check removed - will be added during onboarding

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Selected branch not found. Please select a valid branch.'
      });
    }

    // Validate branch has required fields
    if (!branch.alias) {
      return res.status(400).json({
        success: false,
        message: 'Branch configuration is incomplete. Please contact support.'
      });
    }

    // Generate customer code
    let customerCode;
    try {
      customerCode = await generateCustomId('customer', branch.alias, 'CUST');
    } catch (error) {
      console.error('Error generating customer code:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(500).json({
          success: false,
          message: 'Unable to generate customer code due to a database configuration issue. Please contact your system administrator to reset customer counters.'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate customer code. Please try again or contact support.'
      });
    }

    // Create new customer with basic info only
    const newCustomer = new Customer({
      customerCode,
      branch: branchId,
      tenant: tenant || 'anchorfinance',
      personalInfo: {
        fullName: fullName.trim()
      },
      contact: {
        email: email.toLowerCase(),
        phone: phone.trim()
      },
      onboardingCompleted: false,
      password,
      isActive: true,
      accountCreationSource: 'self-registration'
    });

    await newCustomer.save();

    // Log activity
    await logActivity({
      userId: newCustomer._id,
      action: 'customer_self_registered',
      entityType: 'customer',
      entityId: newCustomer._id,
      details: {
        email,
        fullName,
        branch: branch.name,
        tenant
      }
    });

    // Create in-app notification for admins
    try {
      await InAppNotification.create({
        title: '🎉 New Customer Registration',
        message: `${newCustomer.personalInfo.fullName} has registered for the customer portal. Customer Code: ${newCustomer.customerCode}`,
        type: 'customer_registration',
        priority: 'medium',
        targetRoles: ['admin', 'manager', 'branch-manager', 'loan-officer'],
        relatedCustomer: newCustomer._id,
        actionUrl: `/customers/${newCustomer._id}`,
        actionText: 'View Customer'
      });
      console.log('✅ In-app notification created for customer registration');
    } catch (notifError) {
      console.error('❌ Failed to create in-app notification:', notifError);
    }

    // Generate token
    const token = createToken(newCustomer._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to the portal.',
      token,
      customer: {
        id: newCustomer._id,
        customerCode: newCustomer.customerCode,
        fullName: newCustomer.personalInfo.fullName,
        email: newCustomer.contact.email
      }
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern?.email || error.message?.includes('email')) {
        errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
      } else if (error.keyPattern?.idNumber || error.message?.includes('idNumber')) {
        errorMessage = 'This ID number is already registered. Please check your ID number or contact support.';
      } else if (error.keyPattern?.customerCode || error.message?.includes('customerCode')) {
        errorMessage = 'Unable to generate a unique customer code. Please try again or contact support.';
      } else {
        errorMessage = 'This information is already registered in the system. Please check your details or contact support.';
      }
    } else if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(error.errors).map(err => err.message);
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Customer Login
export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find customer with password field
    const customer = await Customer.findOne({ 'contact.email': email.toLowerCase() })
      .select('+password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if customer has password set (for self-registered accounts)
    if (!customer.password) {
      return res.status(403).json({
        success: false,
        message: 'This account was created by staff. Please contact your branch to set up online access.'
      });
    }

    // Check if account is active
    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is disabled. Please contact your branch.'
      });
    }

    // Compare password
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Log activity
    await logActivity({
      userId: customer._id,
      action: 'customer_logged_in',
      entityType: 'customer',
      entityId: customer._id,
      details: {
        email,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });

    // Generate token
    const token = createToken(customer._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      customer: {
        id: customer._id,
        customerCode: customer.customerCode,
        fullName: customer.personalInfo.fullName,
        email: customer.contact.email,
        phone: customer.contact.phone,
        lastLogin: customer.lastLogin
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Get current customer info (for token verification)
export const getCurrentCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.customerId)
      .populate('branch', 'name code alias')
      .select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer._id,
        customerCode: customer.customerCode,
        fullName: customer.personalInfo.fullName,
        email: customer.contact.email,
        phone: customer.contact.phone,
        branch: customer.branch,
        lastLogin: customer.lastLogin,
        accountCreationSource: customer.accountCreationSource
      }
    });
  } catch (error) {
    console.error('Get current customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get list of available tenants (public endpoint) - Single tenant mode
export const getAvailableTenants = async (req, res) => {
  try {
    // Single tenant mode - return default tenant
    res.json({
      success: true,
      data: [{
        id: 'creditjambo',
        name: 'Credit Jambo',
        value: 'creditjambo'
      }]
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants'
    });
  }
};

// Get branches (public endpoint) - Single tenant mode
export const getBranchesByTenant = async (req, res) => {
  try {
    // Single tenant mode - no need to switch databases
    const branches = await Branch.find({}).select('name code alias contactInfo').lean();
    
    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches'
    });
  }
};

