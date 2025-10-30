import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  alias: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  services: [{
    type: String,
    enum: ['savings', 'loans', 'transfers', 'payments']
  }],
  capacity: {
    maxCustomers: {
      type: Number,
      default: 1000
    },
    maxTransactions: {
      type: Number,
      default: 10000
    }
  },
  settings: {
    allowOnlineRegistration: {
      type: Boolean,
      default: true
    },
    requireKYC: {
      type: Boolean,
      default: true
    },
    minDepositAmount: {
      type: Number,
      default: 1000
    },
    maxDepositAmount: {
      type: Number,
      default: 1000000
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
branchSchema.index({ code: 1 });
branchSchema.index({ alias: 1 });
branchSchema.index({ isActive: 1 });

// Virtual for branch statistics
branchSchema.virtual('stats', {
  ref: 'Customer',
  localField: '_id',
  foreignField: 'branch',
  count: true
});

// Pre-save middleware
branchSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  if (this.isModified('alias')) {
    this.alias = this.alias.toLowerCase();
  }
  next();
});

// Static methods
branchSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

branchSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

branchSchema.statics.findByAlias = function(alias) {
  return this.findOne({ alias: alias.toLowerCase() });
};

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;






