import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Session Information
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Token Information
  token: {
    type: String,
    required: true
  },
  
  // Login Information
  loginInfo: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    location: {
      country: String,
      city: String,
      region: String
    },
    deviceInfo: {
      browser: String,
      os: String,
      device: String
    }
  },
  
  // Logout Information
  logoutInfo: {
    timestamp: Date,
    reason: {
      type: String,
      enum: ['user_logout', 'session_expired', 'inactivity', 'security_breach', 'admin_terminated', 'system_maintenance'],
      default: null
    },
    ipAddress: String
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['active', 'expired', 'terminated', 'suspended'],
    default: 'active'
  },
  
  // Security Information
  security: {
    lastActivity: {
      type: Date,
      default: Date.now
    },
    activityCount: {
      type: Number,
      default: 0
    },
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    flags: [String]
  },
  
  // Branch Information (removed for savings management system)
  // branch: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Branch',
  //   required: false
  // },
  
  // Session Duration
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // Metadata
  metadata: {
    loginAttempts: {
      type: Number,
      default: 1
    },
    failedAttempts: {
      type: Number,
      default: 0
    },
    lastFailedAttempt: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for performance
sessionSchema.index({ user: 1, status: 1 });
sessionSchema.index({ 'loginInfo.timestamp': -1 });
sessionSchema.index({ 'security.lastActivity': -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ 'security.riskLevel': 1 });

// Virtual for session duration
sessionSchema.virtual('sessionDuration').get(function() {
  const endTime = this.logoutInfo?.timestamp || new Date();
  return endTime - this.loginInfo.timestamp;
});

// Virtual for formatted login time
sessionSchema.virtual('formattedLoginTime').get(function() {
  return this.loginInfo.timestamp.toLocaleString();
});

// Virtual for formatted logout time
sessionSchema.virtual('formattedLogoutTime').get(function() {
  return this.logoutInfo?.timestamp?.toLocaleString() || 'Active';
});

// Pre-save middleware to update duration
sessionSchema.pre('save', function(next) {
  if (this.logoutInfo?.timestamp) {
    this.duration = this.logoutInfo.timestamp - this.loginInfo.timestamp;
  }
  next();
});

// Method to update last activity
sessionSchema.methods.updateActivity = function() {
  this.security.lastActivity = new Date();
  this.security.activityCount += 1;
  return this.save();
};

// Method to terminate session
sessionSchema.methods.terminate = function(reason = 'admin_terminated') {
  this.status = 'terminated';
  this.logoutInfo = {
    timestamp: new Date(),
    reason,
    ipAddress: this.loginInfo.ipAddress
  };
  this.duration = this.logoutInfo.timestamp - this.loginInfo.timestamp;
  return this.save();
};

// Ensure virtuals are included in JSON output
sessionSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
