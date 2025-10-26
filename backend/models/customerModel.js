import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    required: true // Example: CUST-KGL-001
  },
  // branch: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Branch',
  //   required: true
  // }, // Removed for savings management system
  tenant: {
    type: String, // Store tenant/organization name
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for self-registration
  },
  // Authentication fields
  password: {
    type: String,
    required: true, // Required for savings management system
    minlength: 8,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  accountCreationSource: {
    type: String,
    enum: ['staff', 'self-registration'],
    default: 'self-registration'
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  // Device verification status
  deviceVerified: {
    type: Boolean,
    default: false
  },
  // Savings account reference
  savingsAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsAccount'
  },
  personalInfo: {
    fullName: { type: String, required: true, trim: true },
    dob: { type: Date, required: false },
    gender: { type: String, enum: ['Male', 'Female'], required: false },
    placeOfBirth: { type: String },
    nationality: { type: String, default: 'Rwandan' },
    idNumber: { type: String, required: false },
    idFile: { type: String },
    photo: { type: String } // Customer photo (optional)
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    address: {
      province: String,
      district: String,
      sector: String,
      cell: String,
      village: String
    }
  },
  maritalStatus: {
    status: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    spouseIdFile: String,
    marriageCertFile: String,
    singleCertFile: String
  },
  employment: {
    status: { type: String, enum: ['Employed', 'Self-Employed', 'Unemployed'] },
    jobTitle: String,
    employerName: String,
    employerAddress: String,
    employerContact: String,
    salary: Number,
    contractCertificate: String,
    stampedPaySlips: [String],
    businessName: String,
    businessType: String,
    businessCertificate: String,
    monthlyRevenue: Number
  },

  // Additional files and documents
  additionalFiles: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']
    },
    category: {
      type: String,
      enum: ['identification', 'financial', 'legal', 'employment', 'other'],
      default: 'other'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Auto update updatedAt
customerSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  
  // Hash password if modified and exists
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

// Method to compare passwords using SHA-512 (as required by assessment)
customerSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if customer can login (device verification required)
customerSchema.methods.canLogin = function() {
  return this.isActive && this.deviceVerified && this.onboardingCompleted;
};

// Method to get customer summary for admin interface
customerSchema.methods.getSummary = function() {
  return {
    id: this._id,
    customerCode: this.customerCode,
    fullName: this.personalInfo.fullName,
    email: this.contact.email,
    phone: this.contact.phone,
    isActive: this.isActive,
    deviceVerified: this.deviceVerified,
    onboardingCompleted: this.onboardingCompleted,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

// Add database indexes for better performance
customerSchema.index({ customerCode: 1 }, { unique: true });
customerSchema.index({ "personalInfo.idNumber": 1 }, { unique: true });
// customerSchema.index({ branch: 1, createdAt: -1 }); // Removed for savings management system
customerSchema.index({ "personalInfo.fullName": 1 });
customerSchema.index({ "contact.email": 1 }, { unique: true, sparse: true });
customerSchema.index({ "contact.phone": 1 });
// customerSchema.index({ isActive: 1, branch: 1 }); // Removed for savings management system
customerSchema.index({ onboardingCompleted: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
