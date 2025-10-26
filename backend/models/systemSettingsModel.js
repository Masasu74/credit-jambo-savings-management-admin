import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  // Company/Brand Information
  companyName: {
    type: String,
    required: true,
    default: 'NDFI TRACK',
    trim: true
  },
  companySlogan: {
    type: String,
    trim: true,
    default: 'Empowering Financial Growth'
  },
  companyDescription: {
    type: String,
    trim: true,
    default: 'A comprehensive financial management system for non-deposit financial institutions'
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    trim: true,
    default: 'info@ndfis.com'
  },
  contactPhone: {
    type: String,
    trim: true,
    default: '+250 788 123 456'
  },
  contactAddress: {
    type: String,
    trim: true,
    default: 'Kigali, Rwanda'
  },
  website: {
    type: String,
    trim: true,
    default: 'https://ndfis.com'
  },
  
  // Branding Assets
  logo: {
    type: String,
    default: '/logo.png'
  },
  favicon: {
    type: String,
    default: '/favicon.png'
  },
  loginBackground: {
    type: String,
    default: '/login-background.png'
  },
  
  // Color Scheme
  primaryColor: {
    type: String,
    default: '#2563eb',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Primary color must be a valid hex color'
    }
  },
  secondaryColor: {
    type: String,
    default: '#64748b',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Secondary color must be a valid hex color'
    }
  },
  accentColor: {
    type: String,
    default: '#f59e0b',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Accent color must be a valid hex color'
    }
  },
  successColor: {
    type: String,
    default: '#10b981',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Success color must be a valid hex color'
    }
  },
  warningColor: {
    type: String,
    default: '#f59e0b',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Warning color must be a valid hex color'
    }
  },
  errorColor: {
    type: String,
    default: '#ef4444',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Error color must be a valid hex color'
    }
  },
  
  // System Configuration
  currency: {
    type: String,
    default: 'RWF',
    enum: ['RWF', 'USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'BIF', 'CDF']
  },
  currencySymbol: {
    type: String,
    default: 'Frw',
    trim: true
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY',
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY']
  },
  timeFormat: {
    type: String,
    default: '24',
    enum: ['12', '24']
  },
  timezone: {
    type: String,
    default: 'Africa/Kigali',
    trim: true
  },
  
  // Business Configuration
  businessType: {
    type: String,
    default: 'Non-Deposit Financial Institution',
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  taxIdentificationNumber: {
    type: String,
    trim: true
  },
  
  // System Features
  features: {
    customerManagement: { type: Boolean, default: true },
    loanManagement: { type: Boolean, default: true },
    employeeManagement: { type: Boolean, default: true },
    attendanceTracking: { type: Boolean, default: true },
    expenseManagement: { type: Boolean, default: true },
    reporting: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    auditLogs: { type: Boolean, default: true },
    multiBranch: { type: Boolean, default: true },
    customerPortal: { type: Boolean, default: true }
  },
  
  // Email Configuration
  emailSettings: {
    smtpHost: { type: String, trim: true },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, trim: true },
    smtpPassword: { type: String, trim: true },
    fromEmail: { type: String, trim: true },
    fromName: { type: String, trim: true }
  },
  
  // SMS Configuration
  smsSettings: {
    provider: { type: String, trim: true },
    apiKey: { type: String, trim: true },
    apiSecret: { type: String, trim: true },
    senderId: { type: String, trim: true }
  },
  
  // Security Settings
  security: {
    passwordMinLength: { type: Number, default: 8 },
    passwordRequireUppercase: { type: Boolean, default: true },
    passwordRequireLowercase: { type: Boolean, default: true },
    passwordRequireNumbers: { type: Boolean, default: true },
    passwordRequireSpecialChars: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 6 }, // hours
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 }, // minutes
    requireTwoFactor: { type: Boolean, default: false }
  },
  
  // Notification Settings
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    loanApprovalNotifications: { type: Boolean, default: true },
    paymentReminders: { type: Boolean, default: true },
    overdueAlerts: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true }
  },
  
  // Custom Fields
  customFields: {
    customer: [{
      name: { type: String, required: true },
      type: { type: String, enum: ['text', 'number', 'date', 'select', 'textarea'], required: true },
      required: { type: Boolean, default: false },
      options: [{ type: String }], // for select type
      order: { type: Number, default: 0 }
    }],
    loan: [{
      name: { type: String, required: true },
      type: { type: String, enum: ['text', 'number', 'date', 'select', 'textarea'], required: true },
      required: { type: Boolean, default: false },
      options: [{ type: String }], // for select type
      order: { type: Number, default: 0 }
    }]
  },
  
  // Metadata
  version: {
    type: String,
    default: '1.0.0'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true });

// Pre-save middleware to update lastUpdated
systemSettingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);
