import Customer from '../models/customerModel.js';
import DeviceVerification from '../models/deviceVerificationModel.js';
import InAppNotification from '../models/inAppNotificationModel.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { logActivity } from '../utils/logActivity.js';
import { generateCustomId } from '../utils/generateCustomId.js';
import crypto from 'crypto';

// Create JWT token
const createToken = (customerId) => {
  return jwt.sign({ customerId, type: 'customer' }, process.env.JWT_SECRET, {
    // Short-lived token to satisfy session expiry on inactivity/close
    expiresIn: process.env.CUSTOMER_JWT_EXPIRES_IN || '30m'
  });
};

// Helper function to get an admin user for notifications
const getAdminUserForNotification = async () => {
  try {
    // Try to find an active admin user
    const adminUser = await User.findOne({ 
      role: 'admin', 
      isActive: true 
    }).select('_id').lean();
    
    if (adminUser) {
      return adminUser._id;
    }
    
    // If no admin found, try to find any active user
    const anyUser = await User.findOne({ 
      isActive: true 
    }).select('_id').lean();
    
    return anyUser?._id || null;
  } catch (error) {
    console.error('Error finding admin user for notification:', error);
    return null;
  }
};

// Helper function to create device verification notification
const createDeviceVerificationNotification = async (title, message, customerId, deviceId, actionUrl) => {
  try {
    const adminUserId = await getAdminUserForNotification();
    
    if (!adminUserId) {
      console.warn('⚠️ No admin user found, skipping device verification notification');
      return null;
    }
    
    await InAppNotification.create({
      title,
      message,
      type: 'alert', // Use valid enum value
      priority: 'high',
      targetRoles: ['admin', 'manager'],
      relatedCustomer: customerId,
      actionUrl,
      actionText: 'View Device',
      createdBy: adminUserId
    });
    
    return true;
  } catch (notifError) {
    console.error('Failed to create device verification notification:', notifError);
    return null;
  }
};

// Helper function to auto-register device for verification
const autoRegisterDevice = async (customerId, deviceId, req) => {
  if (!deviceId) return null;

  try {
    // Check if device already exists (deviceId is unique, so check by deviceId only)
    let device = await DeviceVerification.findOne({ deviceId });
    
    if (device) {
      // Device exists - check if it belongs to the same customer
      if (device.customerId.toString() === customerId.toString()) {
        // Same customer, same device - return existing device
        return device;
      } else {
        // Device belongs to a different customer - update it to the new customer
        // This handles cases where a device is transferred or reused
        device.customerId = customerId;
        device.status = 'pending';
        device.isActive = true;
        
        // Update device info
        const userAgent = req.get('User-Agent') || 'Unknown';
        device.deviceInfo = {
          userAgent,
          platform: 'Mobile',
          browser: 'Expo',
          os: userAgent.includes('iOS') ? 'iOS' : userAgent.includes('Android') ? 'Android' : 'Unknown',
          language: req.get('Accept-Language')?.split(',')[0] || 'en'
        };
        device.ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
        
        // Generate new verification code
        const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        device.verificationCode = verificationCode;
        device.verificationExpiry = new Date();
        device.verificationExpiry.setHours(device.verificationExpiry.getHours() + 24);
        
        await device.save();
        
        // Create notification for admins about device transfer
        await createDeviceVerificationNotification(
          '🔔 Device Verification Request (Transferred)',
          `Device transferred to new customer. Device ID: ${deviceId.substring(0, 8)}...`,
          customerId,
          deviceId,
          `/device-verifications/${device._id}`
        );
        
        return device;
      }
    } else {
      // Device doesn't exist - create new one
      // Generate verification code
      const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

      // Extract device info from request
      const userAgent = req.get('User-Agent') || 'Unknown';
      const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';

      // Create new device verification record
      device = new DeviceVerification({
        customerId,
        deviceId,
        deviceInfo: {
          userAgent,
          platform: 'Mobile',
          browser: 'Expo',
          os: userAgent.includes('iOS') ? 'iOS' : userAgent.includes('Android') ? 'Android' : 'Unknown',
          language: req.get('Accept-Language')?.split(',')[0] || 'en'
        },
        ipAddress,
        status: 'pending',
        verificationCode,
        verificationExpiry,
        isActive: true
      });

      await device.save();

      // Create notification for admins
      await createDeviceVerificationNotification(
        '🔔 New Device Verification Request',
        `Customer device needs verification. Device ID: ${deviceId.substring(0, 8)}...`,
        customerId,
        deviceId,
        `/device-verifications/${device._id}`
      );
      
      return device;
    }
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000 && error.keyPattern?.deviceId) {
      console.error(`Duplicate deviceId detected: ${deviceId}. Attempting to find existing device.`);
      // Try to find the existing device
      const existingDevice = await DeviceVerification.findOne({ deviceId });
      if (existingDevice) {
        // Update to current customer if different
        if (existingDevice.customerId.toString() !== customerId.toString()) {
          existingDevice.customerId = customerId;
          existingDevice.status = 'pending';
          await existingDevice.save();
        }
        return existingDevice;
      }
    }
    console.error('Error auto-registering device:', error);
    return null;
  }
};

// Customer Registration
export const registerCustomer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      tenant,
      // Optional profile fields coming from mobile sign-up
      dob,
      gender,
      employmentStatus,
      jobTitle,
      salary,
      businessName,
      monthlyRevenue
    } = req.body;

    // Validate required fields (only basic fields for registration)
    if (!fullName || !email || !password || !phone) {
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

    // Basic phone validation & normalization
    const normalizedPhone = String(phone).replace(/\s|\-/g, '');
    if (normalizedPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    // Optional DOB 18+ validation
    if (dob) {
      const birth = new Date(dob);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 18) {
          return res.status(400).json({ success: false, message: 'You must be at least 18 years old to register' });
        }
      }
    }

    // Generate customer code
    let customerCode;
    try {
      // Branch-less identifier generation (use a static org alias)
      customerCode = await generateCustomId('customer', 'CJ', 'CUST');
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

    // Map employment status to model enum casing
    const toEmploymentEnum = (s) => {
      if (!s) return undefined;
      const map = {
        'employed': 'Employed',
        'self-employed': 'Self-Employed',
        'unemployed': 'Unemployed',
        'student': 'Unemployed',
        'retired': 'Unemployed'
      };
      return map[String(s).toLowerCase()] || undefined;
    };

    // Create new customer with structured info
    const newCustomer = new Customer({
      customerCode,
      tenant: tenant || 'anchorfinance',
      personalInfo: {
        fullName: fullName.trim(),
        dob: dob ? new Date(dob) : undefined,
        gender: gender || undefined
      },
      contact: {
        email: email.toLowerCase(),
        phone: normalizedPhone
      },
      employment: {
        status: toEmploymentEnum(employmentStatus),
        jobTitle: jobTitle || undefined,
        salary: salary ? Number(salary) : undefined,
        businessName: businessName || undefined,
        monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : undefined
      },
      onboardingCompleted: false,
      password,
      isActive: true,
      accountCreationSource: 'self-registration'
    });

    await newCustomer.save();

    // Auto-register device if deviceId provided during registration
    const deviceId = req.headers['x-device-id'] || req.get('x-device-id');
    if (deviceId) {
      const device = await autoRegisterDevice(newCustomer._id, deviceId, req);
      if (device) {
        console.log(`✅ Device registered for customer ${newCustomer._id}: ${deviceId.substring(0, 8)}...`);
      } else {
        console.warn(`⚠️ Failed to register device for customer ${newCustomer._id}: ${deviceId.substring(0, 8)}...`);
      }
    } else {
      console.warn(`⚠️ No device ID provided during registration for customer ${newCustomer._id}`);
    }

    // Log activity
    await logActivity({
      userId: newCustomer._id,
      action: 'customer_self_registered',
      entityType: 'customer',
      entityId: newCustomer._id,
      details: {
        email,
        fullName,
        tenant
      }
    });

    // Create in-app notification for admins
    try {
      const adminUserId = await getAdminUserForNotification();
      
      if (adminUserId) {
        await InAppNotification.create({
          title: '🎉 New Customer Registration',
          message: `${newCustomer.personalInfo.fullName} has registered for the customer portal. Customer Code: ${newCustomer.customerCode}`,
          type: 'customer_added', // Use valid enum value
          priority: 'medium',
          targetRoles: ['admin', 'manager', 'loan-officer'],
          relatedCustomer: newCustomer._id,
          actionUrl: `/customers/${newCustomer._id}`,
          actionText: 'View Customer',
          createdBy: adminUserId
        });
        console.log('✅ In-app notification created for customer registration');
      } else {
        console.warn('⚠️ No admin user found, skipping customer registration notification');
      }
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
    const deviceId = req.headers['x-device-id'];

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

    // Enforce device verification before login
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required. Please provide header x-device-id.'
      });
    }

    const isVerifiedDevice = await DeviceVerification.isDeviceVerified(customer._id, deviceId);
    if (!isVerifiedDevice) {
      // Auto-register device for verification if not already registered
      await autoRegisterDevice(customer._id, deviceId, req);
      
      return res.status(403).json({
        success: false,
        message: 'This device is not verified. Please contact admin to verify your device before logging in.'
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
        lastLogin: customer.lastLogin,
        deviceVerified: customer.deviceVerified || false
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
      .select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check actual device verification status for the current device
    const deviceId = req.headers['x-device-id'];
    let deviceVerified = false;
    if (deviceId) {
      deviceVerified = await DeviceVerification.isDeviceVerified(customer._id, deviceId);
    } else {
      // Fallback to customer's global deviceVerified flag if no deviceId provided
      deviceVerified = customer.deviceVerified || false;
    }

    const responseData = {
      id: customer._id,
      customerCode: customer.customerCode,
      fullName: customer.personalInfo.fullName,
      email: customer.contact.email,
      phone: customer.contact.phone,
      lastLogin: customer.lastLogin,
      accountCreationSource: customer.accountCreationSource,
      deviceVerified
    };
    
    console.log('🔍 getCurrentCustomer response:', JSON.stringify(responseData, null, 2));
    
    res.json({
      success: true,
      customer: responseData
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

