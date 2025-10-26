import DeviceVerification from '../models/deviceVerificationModel.js';
import Customer from '../models/customerModel.js';
import { 
  deviceVerificationSummaryDTO,
  deviceVerificationDetailsDTO,
  deviceVerificationWithCustomerDTO,
  deviceVerificationListDTO,
  deviceVerificationStatsDTO,
  customerDevicesDTO,
  pendingVerificationDTO
} from '../dtos/deviceVerificationDTO.js';

// Register device for verification
export const registerDevice = async (req, res) => {
  try {
    const { customerId, deviceId, deviceInfo, ipAddress, location } = req.body;

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if device is already registered
    const existingDevice = await DeviceVerification.findOne({ deviceId });
    if (existingDevice) {
      if (existingDevice.status === 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Device is already verified'
        });
      }
      
      if (existingDevice.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Device verification is already pending'
        });
      }
    }

    // Create or update device verification
    const deviceVerification = existingDevice || new DeviceVerification({
      customerId,
      deviceId,
      deviceInfo,
      ipAddress,
      location
    });

    if (existingDevice) {
      // Update existing device
      deviceVerification.deviceInfo = deviceInfo;
      deviceVerification.ipAddress = ipAddress;
      deviceVerification.location = location;
      deviceVerification.status = 'pending';
      deviceVerification.isActive = true;
    }

    await deviceVerification.save();

    res.status(201).json({
      success: true,
      message: 'Device registered for verification',
      data: {
        verificationId: deviceVerification._id,
        verificationCode: deviceVerification.verificationCode,
        expiry: deviceVerification.verificationExpiry,
        message: 'Please provide the verification code to an admin for verification'
      }
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error.message
    });
  }
};

// Verify device (admin only)
export const verifyDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'verify', 'reject', 'suspend'
    const adminId = req.user.id;

    const deviceVerification = await DeviceVerification.findById(id)
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone');

    if (!deviceVerification) {
      return res.status(404).json({
        success: false,
        message: 'Device verification not found'
      });
    }

    if (deviceVerification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Device is not pending verification'
      });
    }

    switch (action) {
      case 'verify':
        deviceVerification.verifyDevice(adminId);
        // Update customer device verification status
        await Customer.findByIdAndUpdate(deviceVerification.customerId._id, { 
          deviceVerified: true 
        });
        break;
      
      case 'reject':
        deviceVerification.rejectDevice(reason, adminId);
        break;
      
      case 'suspend':
        deviceVerification.suspendDevice(reason, adminId);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: verify, reject, or suspend'
        });
    }

    await deviceVerification.save();

    res.json({
      success: true,
      message: `Device ${action}ed successfully`,
      data: deviceVerificationWithCustomerDTO(deviceVerification, deviceVerification.customerId)
    });
  } catch (error) {
    console.error('Error verifying device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify device',
      error: error.message
    });
  }
};

// Get pending device verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await DeviceVerification.getPendingVerifications(page, limit);

    res.json({
      success: true,
      data: {
        verifications: result.verifications.map(pendingVerificationDTO),
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications',
      error: error.message
    });
  }
};

// Get all device verifications with filters
export const getDeviceVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const customerId = req.query.customerId;

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const verifications = await DeviceVerification.find(query)
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DeviceVerification.countDocuments(query);

    res.json({
      success: true,
      data: deviceVerificationListDTO(verifications, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      })
    });
  } catch (error) {
    console.error('Error fetching device verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device verifications',
      error: error.message
    });
  }
};

// Get device verification by ID
export const getDeviceVerificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await DeviceVerification.findById(id)
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone');

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Device verification not found'
      });
    }

    res.json({
      success: true,
      data: deviceVerificationWithCustomerDTO(verification, verification.customerId)
    });
  } catch (error) {
    console.error('Error fetching device verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device verification',
      error: error.message
    });
  }
};

// Get customer devices
export const getCustomerDevices = async (req, res) => {
  try {
    const { customerId } = req.params;

    const devices = await DeviceVerification.getCustomerDevices(customerId);

    res.json({
      success: true,
      data: customerDevicesDTO(devices)
    });
  } catch (error) {
    console.error('Error fetching customer devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer devices',
      error: error.message
    });
  }
};

// Check if device is verified
export const checkDeviceVerification = async (req, res) => {
  try {
    const { customerId, deviceId } = req.params;

    const isVerified = await DeviceVerification.isDeviceVerified(customerId, deviceId);

    res.json({
      success: true,
      data: {
        isVerified,
        message: isVerified ? 'Device is verified' : 'Device is not verified'
      }
    });
  } catch (error) {
    console.error('Error checking device verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check device verification',
      error: error.message
    });
  }
};

// Record device login
export const recordDeviceLogin = async (req, res) => {
  try {
    const { customerId, deviceId } = req.body;

    const device = await DeviceVerification.findOne({ 
      customerId, 
      deviceId, 
      status: 'verified' 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Verified device not found'
      });
    }

    device.recordLogin();
    await device.save();

    res.json({
      success: true,
      message: 'Login recorded successfully',
      data: {
        lastLoginAt: device.lastLoginAt,
        loginCount: device.loginCount
      }
    });
  } catch (error) {
    console.error('Error recording device login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record device login',
      error: error.message
    });
  }
};

// Get device verification statistics
export const getDeviceVerificationStats = async (req, res) => {
  try {
    const stats = await DeviceVerification.getVerificationStats();

    res.json({
      success: true,
      data: deviceVerificationStatsDTO(stats)
    });
  } catch (error) {
    console.error('Error fetching device verification statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device verification statistics',
      error: error.message
    });
  }
};

// Suspend device
export const suspendDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const deviceVerification = await DeviceVerification.findById(id);
    if (!deviceVerification) {
      return res.status(404).json({
        success: false,
        message: 'Device verification not found'
      });
    }

    deviceVerification.suspendDevice(reason, adminId);
    await deviceVerification.save();

    res.json({
      success: true,
      message: 'Device suspended successfully',
      data: deviceVerificationDetailsDTO(deviceVerification)
    });
  } catch (error) {
    console.error('Error suspending device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend device',
      error: error.message
    });
  }
};

// Reactivate device
export const reactivateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const deviceVerification = await DeviceVerification.findById(id);
    if (!deviceVerification) {
      return res.status(404).json({
        success: false,
        message: 'Device verification not found'
      });
    }

    if (deviceVerification.status !== 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Device is not suspended'
      });
    }

    deviceVerification.status = 'verified';
    deviceVerification.isActive = true;
    deviceVerification.verifiedBy = adminId;
    deviceVerification.verifiedAt = new Date();

    await deviceVerification.save();

    res.json({
      success: true,
      message: 'Device reactivated successfully',
      data: deviceVerificationDetailsDTO(deviceVerification)
    });
  } catch (error) {
    console.error('Error reactivating device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate device',
      error: error.message
    });
  }
};
