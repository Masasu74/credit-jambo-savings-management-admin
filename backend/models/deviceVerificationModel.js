import mongoose from 'mongoose';

const deviceVerificationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceInfo: {
    userAgent: {
      type: String,
      required: true,
      maxlength: 500
    },
    platform: {
      type: String,
      required: true
    },
    browser: {
      type: String,
      required: true
    },
    os: {
      type: String,
      required: true
    },
    screenResolution: {
      type: String
    },
    timezone: {
      type: String
    },
    language: {
      type: String
    }
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending',
    required: true
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  verificationExpiry: {
    type: Date,
    required: true
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  lastLoginAt: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
deviceVerificationSchema.index({ customerId: 1, status: 1 });
deviceVerificationSchema.index({ deviceId: 1 });
deviceVerificationSchema.index({ verificationCode: 1 });
deviceVerificationSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate verification code
deviceVerificationSchema.pre('save', async function(next) {
  if (this.isNew && !this.verificationCode) {
    // Generate 6-digit verification code
    this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiry to 24 hours from now
    this.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  this.updatedAt = new Date();
  next();
});

// Instance method to check if verification code is valid
deviceVerificationSchema.methods.isVerificationCodeValid = function(code) {
  if (this.status !== 'pending') {
    return { valid: false, reason: 'Device is not pending verification' };
  }
  
  if (this.verificationExpiry < new Date()) {
    return { valid: false, reason: 'Verification code has expired' };
  }
  
  if (this.verificationCode !== code) {
    return { valid: false, reason: 'Invalid verification code' };
  }
  
  return { valid: true };
};

// Instance method to verify device
deviceVerificationSchema.methods.verifyDevice = function(verifiedBy) {
  this.status = 'verified';
  this.verifiedAt = new Date();
  this.verifiedBy = verifiedBy;
  this.isActive = true;
};

// Instance method to reject device
deviceVerificationSchema.methods.rejectDevice = function(reason, rejectedBy) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.verifiedBy = rejectedBy;
  this.isActive = false;
};

// Instance method to suspend device
deviceVerificationSchema.methods.suspendDevice = function(reason, suspendedBy) {
  this.status = 'suspended';
  this.rejectionReason = reason;
  this.verifiedBy = suspendedBy;
  this.isActive = false;
};

// Instance method to record login
deviceVerificationSchema.methods.recordLogin = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
};

// Static method to get pending verifications
deviceVerificationSchema.statics.getPendingVerifications = async function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const verifications = await this.find({ status: 'pending' })
    .populate('customerId', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments({ status: 'pending' });
  
  return {
    verifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get customer devices
deviceVerificationSchema.statics.getCustomerDevices = async function(customerId) {
  return await this.find({ customerId })
    .sort({ createdAt: -1 })
    .select('deviceId deviceInfo status verifiedAt lastLoginAt loginCount isActive createdAt');
};

// Static method to check if device is verified
deviceVerificationSchema.statics.isDeviceVerified = async function(customerId, deviceId) {
  const device = await this.findOne({ 
    customerId, 
    deviceId, 
    status: 'verified',
    isActive: true 
  });
  
  return !!device;
};

// Static method to get verification statistics
deviceVerificationSchema.statics.getVerificationStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await this.countDocuments();
  
  return {
    stats,
    total,
    pending: stats.find(s => s._id === 'pending')?.count || 0,
    verified: stats.find(s => s._id === 'verified')?.count || 0,
    rejected: stats.find(s => s._id === 'rejected')?.count || 0,
    suspended: stats.find(s => s._id === 'suspended')?.count || 0
  };
};

const DeviceVerification = mongoose.model('DeviceVerification', deviceVerificationSchema);

export default DeviceVerification;
