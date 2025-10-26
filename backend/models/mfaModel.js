import mongoose from 'mongoose';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const mfaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // TOTP (Time-based One-Time Password) settings
  totp: {
    secret: {
      type: String,
      default: null
    },
    isEnabled: {
      type: Boolean,
      default: false
    },
    backupCodes: [{
      code: {
        type: String,
        required: true
      },
      isUsed: {
        type: Boolean,
        default: false
      },
      usedAt: {
        type: Date,
        default: null
      }
    }],
    lastUsed: {
      type: Date,
      default: null
    }
  },

  // SMS verification settings
  sms: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    phoneNumber: {
      type: String,
      default: null
    },
    lastCode: {
      type: String,
      default: null
    },
    lastCodeExpiry: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttempt: {
      type: Date,
      default: null
    }
  },

  // Email verification settings
  email: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    emailAddress: {
      type: String,
      default: null
    },
    lastCode: {
      type: String,
      default: null
    },
    lastCodeExpiry: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttempt: {
      type: Date,
      default: null
    }
  },

  // MFA settings
  mfaType: {
    type: String,
    enum: ['totp', 'sms', 'email', 'totp_sms', 'totp_email', 'sms_email', 'all'],
    default: 'totp'
  },

  isEnabled: {
    type: Boolean,
    default: false
  },

  // Security settings
  maxAttempts: {
    type: Number,
    default: 5
  },

  lockoutDuration: {
    type: Number,
    default: 15 // minutes
  },

  isLocked: {
    type: Boolean,
    default: false
  },

  lockoutUntil: {
    type: Date,
    default: null
  },

  // Audit fields
  lastLogin: {
    type: Date,
    default: null
  },

  failedAttempts: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes (user already has unique index from schema)
mfaSchema.index({ 'totp.secret': 1 });
mfaSchema.index({ 'sms.phoneNumber': 1 });
mfaSchema.index({ 'email.emailAddress': 1 });

// Pre-save middleware
mfaSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate TOTP secret
mfaSchema.methods.generateTOTPSecret = function() {
  const secret = speakeasy.generateSecret({
    name: 'NDFI TRACK',
    issuer: 'NDFI TRACK',
    length: 32
  });

  this.totp.secret = secret.base32;
  return secret;
};

// Generate QR code for TOTP
mfaSchema.methods.generateQRCode = async function() {
  if (!this.totp.secret) {
    throw new Error('TOTP secret not generated');
  }

  const otpauth = speakeasy.otpauthURL({
    secret: this.totp.secret,
    label: 'NDFI TRACK',
    issuer: 'NDFI TRACK',
    algorithm: 'sha1',
    digits: 6,
    period: 30
  });

  return QRCode.toDataURL(otpauth);
};

// Verify TOTP token
mfaSchema.methods.verifyTOTP = function(token) {
  if (!this.totp.secret || !this.totp.isEnabled) {
    return false;
  }

  return speakeasy.totp.verify({
    secret: this.totp.secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) for clock skew
  });
};

// Generate backup codes
mfaSchema.methods.generateBackupCodes = function(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      isUsed: false
    });
  }
  this.totp.backupCodes = codes;
  return codes;
};

// Verify backup code
mfaSchema.methods.verifyBackupCode = function(code) {
  const backupCode = this.totp.backupCodes.find(bc => 
    bc.code === code.toUpperCase() && !bc.isUsed
  );

  if (backupCode) {
    backupCode.isUsed = true;
    backupCode.usedAt = new Date();
    return true;
  }

  return false;
};

// Generate SMS code
mfaSchema.methods.generateSMSCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.sms.lastCode = code;
  this.sms.lastCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.sms.attempts = 0;
  return code;
};

// Verify SMS code
mfaSchema.methods.verifySMSCode = function(code) {
  if (!this.sms.isEnabled || !this.sms.lastCode) {
    return false;
  }

  if (new Date() > this.sms.lastCodeExpiry) {
    return false;
  }

  if (this.sms.attempts >= this.maxAttempts) {
    this.isLocked = true;
    this.lockoutUntil = new Date(Date.now() + this.lockoutDuration * 60 * 1000);
    return false;
  }

  this.sms.attempts++;

  if (this.sms.lastCode === code) {
    this.sms.lastCode = null;
    this.sms.lastCodeExpiry = null;
    this.sms.attempts = 0;
    this.sms.lastUsed = new Date();
    return true;
  }

  return false;
};

// Generate email code
mfaSchema.methods.generateEmailCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.email.lastCode = code;
  this.email.lastCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.email.attempts = 0;
  return code;
};

// Verify email code
mfaSchema.methods.verifyEmailCode = function(code) {
  if (!this.email.isEnabled || !this.email.lastCode) {
    return false;
  }

  if (new Date() > this.email.lastCodeExpiry) {
    return false;
  }

  if (this.email.attempts >= this.maxAttempts) {
    this.isLocked = true;
    this.lockoutUntil = new Date(Date.now() + this.lockoutDuration * 60 * 1000);
    return false;
  }

  this.email.attempts++;

  if (this.email.lastCode === code) {
    this.email.lastCode = null;
    this.email.lastCodeExpiry = null;
    this.email.attempts = 0;
    this.email.lastUsed = new Date();
    return true;
  }

  return false;
};

// Check if MFA is locked
mfaSchema.methods.isLockedOut = function() {
  if (!this.isLocked) {
    return false;
  }

  if (this.lockoutUntil && new Date() > this.lockoutUntil) {
    this.isLocked = false;
    this.lockoutUntil = null;
    this.failedAttempts = 0;
    return false;
  }

  return true;
};

// Reset failed attempts
mfaSchema.methods.resetFailedAttempts = function() {
  this.failedAttempts = 0;
  this.isLocked = false;
  this.lockoutUntil = null;
};

// Get available MFA methods
mfaSchema.methods.getAvailableMethods = function() {
  const methods = [];
  
  if (this.totp.isEnabled) methods.push('totp');
  if (this.sms.isEnabled) methods.push('sms');
  if (this.email.isEnabled) methods.push('email');
  
  return methods;
};

// Check if MFA is required
mfaSchema.methods.isMFARequired = function() {
  return this.isEnabled && this.getAvailableMethods().length > 0;
};

export default mongoose.models.MFA || mongoose.model('MFA', mfaSchema);
