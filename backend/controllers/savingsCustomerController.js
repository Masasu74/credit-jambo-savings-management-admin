import Customer from '../models/customerModel.js';
import SavingsAccount from '../models/savingsAccountModel.js';
import DeviceVerification from '../models/deviceVerificationModel.js';
import { 
  customerSummaryDTO, 
  customerDetailsDTO, 
  customerRegistrationDTO,
  customerLoginDTO,
  customerListDTO,
  customerStatsDTO
} from '../dtos/customerDTO.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logActivity } from '../utils/logActivity.js';
import { generateCustomId } from '../utils/generateCustomId.js';

// Customer registration
export const registerCustomer = async (req, res) => {
  try {
    const { 
      personalInfo, 
      contact, 
      password, 
      deviceId, 
      deviceInfo, 
      ipAddress, 
      location 
    } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { 'contact.email': contact.email },
        { 'personalInfo.idNumber': personalInfo.idNumber }
      ]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email or ID number'
      });
    }

    // Generate customer code
    const customerCode = await generateCustomId('customer', 'SAV', 'CUST');

    // Create customer
    const customer = new Customer({
      customerCode,
      personalInfo,
      contact,
      password,
      accountCreationSource: 'self-registration',
      onboardingCompleted: true,
      isActive: true,
      deviceVerified: false
    });

    await customer.save();

    // Create savings account
    const savingsAccount = new SavingsAccount({
      customerId: customer._id,
      accountType: 'regular',
      minimumBalance: 0,
      interestRate: 2.5, // 2.5% annual interest
      createdBy: customer._id
    });

    await savingsAccount.save();

    // Update customer with savings account reference
    customer.savingsAccount = savingsAccount._id;
    await customer.save();

    // Register device for verification
    const deviceVerification = new DeviceVerification({
      customerId: customer._id,
      deviceId,
      deviceInfo,
      ipAddress,
      location
    });

    await deviceVerification.save();

    // Log activity
    await logActivity({
      userId: customer._id,
      action: 'customer_registered',
      entityType: 'customer',
      entityId: customer._id,
      details: {
        fullName: personalInfo.fullName,
        customerCode,
        email: contact.email
      }
    });

    res.status(201).json({
      success: true,
      data: customerRegistrationDTO(customer),
      verificationCode: deviceVerification.verificationCode,
      message: 'Registration successful. Please wait for device verification.'
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register customer',
      error: error.message
    });
  }
};

// Customer login
export const loginCustomer = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Find customer
    const customer = await Customer.findOne({ 'contact.email': email })
      .select('+password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if customer can login
    if (!customer.canLogin()) {
      return res.status(403).json({
        success: false,
        message: 'Account is not verified or not active'
      });
    }

    // Check device verification
    const isDeviceVerified = await DeviceVerification.isDeviceVerified(customer._id, deviceId);
    if (!isDeviceVerified) {
      return res.status(403).json({
        success: false,
        message: 'Device is not verified. Please contact admin for verification.'
      });
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Record device login
    const device = await DeviceVerification.findOne({ 
      customerId: customer._id, 
      deviceId 
    });
    if (device) {
      device.recordLogin();
      await device.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: customer._id, 
        email: customer.contact.email,
        type: 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log activity
    await logActivity({
      userId: customer._id,
      action: 'customer_login',
      entityType: 'customer',
      entityId: customer._id,
      details: {
        fullName: customer.personalInfo.fullName,
        customerCode: customer.customerCode,
        deviceId,
        ipAddress
      }
    });

    res.json({
      success: true,
      data: customerLoginDTO(customer, token)
    });
  } catch (error) {
    console.error('Error logging in customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

// Get all customers (admin)
export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const deviceVerified = req.query.deviceVerified;
    const search = req.query.search;

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.isActive = status === 'active';
    if (deviceVerified !== undefined) query.deviceVerified = deviceVerified === 'true';

    // Search by name, email, or customer code
    if (search) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .populate('savingsAccount', 'accountNumber balance status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customerListDTO(customers, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      })
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id)
      .populate('savingsAccount', 'accountNumber balance status isVerified')
      .populate('createdBy', 'fullName email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customerDetailsDTO(customer)
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { personalInfo, contact, maritalStatus, employment } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update fields
    if (personalInfo) {
      customer.personalInfo = { ...customer.personalInfo, ...personalInfo };
    }
    if (contact) {
      customer.contact = { ...customer.contact, ...contact };
    }
    if (maritalStatus) {
      customer.maritalStatus = { ...customer.maritalStatus, ...maritalStatus };
    }
    if (employment) {
      customer.employment = { ...customer.employment, ...employment };
    }

    await customer.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'customer_updated',
      entityType: 'customer',
      entityId: customer._id,
      details: {
        fullName: customer.personalInfo.fullName,
        customerCode: customer.customerCode,
        updatedBy: req.user.fullName
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customerDetailsDTO(customer)
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// Activate/Deactivate customer
export const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.isActive = isActive;
    await customer.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: isActive ? 'customer_activated' : 'customer_deactivated',
      entityType: 'customer',
      entityId: customer._id,
      details: {
        fullName: customer.personalInfo.fullName,
        customerCode: customer.customerCode,
        actionBy: req.user.fullName
      }
    });

    res.json({
      success: true,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: customerSummaryDTO(customer)
    });
  } catch (error) {
    console.error('Error toggling customer status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle customer status',
      error: error.message
    });
  }
};

// Get customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const total = await Customer.countDocuments();
    const active = await Customer.countDocuments({ isActive: true });
    const verified = await Customer.countDocuments({ deviceVerified: true });
    const pendingVerification = await Customer.countDocuments({ deviceVerified: false });

    // New customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await Customer.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const stats = {
      total,
      active,
      verified,
      pendingVerification,
      newThisMonth
    };

    res.json({
      success: true,
      data: customerStatsDTO(stats)
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message
    });
  }
};

// Reset customer password (admin)
export const resetCustomerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    customer.password = hashedPassword;
    await customer.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'customer_password_reset',
      entityType: 'customer',
      entityId: customer._id,
      details: {
        fullName: customer.personalInfo.fullName,
        customerCode: customer.customerCode,
        resetBy: req.user.fullName
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        customerCode: customer.customerCode,
        email: customer.contact.email
      }
    });
  } catch (error) {
    console.error('Error resetting customer password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset customer password',
      error: error.message
    });
  }
};

// Get customer profile (for customer portal)
export const getCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user.id;

    const customer = await Customer.findById(customerId)
      .populate('savingsAccount', 'accountNumber balance status isVerified lastTransactionDate');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customerDetailsDTO(customer)
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer profile',
      error: error.message
    });
  }
};

// Update customer profile (for customer portal)
export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { personalInfo, contact, maritalStatus, employment } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update fields
    if (personalInfo) {
      customer.personalInfo = { ...customer.personalInfo, ...personalInfo };
    }
    if (contact) {
      customer.contact = { ...customer.contact, ...contact };
    }
    if (maritalStatus) {
      customer.maritalStatus = { ...customer.maritalStatus, ...maritalStatus };
    }
    if (employment) {
      customer.employment = { ...customer.employment, ...employment };
    }

    await customer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: customerDetailsDTO(customer)
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer profile',
      error: error.message
    });
  }
};
