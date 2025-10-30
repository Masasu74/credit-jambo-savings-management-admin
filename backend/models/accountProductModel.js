import mongoose from 'mongoose';

const accountProductSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['regular', 'premium', 'fixed', 'youth', 'senior', 'business'],
    required: true,
    default: 'regular'
  },
  minimumDeposit: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minimumBalance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  monthlyFee: {
    type: Number,
    default: 0,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  interestFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually'],
    default: 'monthly'
  },
  features: [{
    type: String
  }],
  eligibility: {
    minAge: {
      type: Number,
      default: 18,
      min: 0
    },
    maxAge: {
      type: Number,
      default: null
    },
    minSalary: {
      type: Number,
      default: 0
    }
  },
  depositLimits: {
    minDeposit: {
      type: Number,
      default: 0
    },
    maxDeposit: {
      type: Number,
      default: null
    },
    minWithdrawal: {
      type: Number,
      default: 0
    },
    maxWithdrawal: {
      type: Number,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
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
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
accountProductSchema.index({ productCode: 1, isActive: 1 });
accountProductSchema.index({ isActive: 1, displayOrder: 1 });

// Pre-save middleware to update updatedAt
accountProductSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active products
accountProductSchema.statics.getActiveProducts = async function() {
  return await this.find({ isActive: true })
    .sort({ displayOrder: 1, productName: 1 })
    .populate('createdBy', 'name email');
};

// Static method to get product by code
accountProductSchema.statics.getProductByCode = async function(productCode) {
  return await this.findOne({ productCode: productCode.toUpperCase() });
};

// Instance method to check eligibility
accountProductSchema.methods.checkEligibility = function(customerAge, customerSalary = 0) {
  if (this.eligibility.minAge && customerAge < this.eligibility.minAge) {
    return { 
      eligible: false, 
      reason: `Minimum age is ${this.eligibility.minAge} years` 
    };
  }
  
  if (this.eligibility.maxAge && customerAge > this.eligibility.maxAge) {
    return { 
      eligible: false, 
      reason: `Maximum age is ${this.eligibility.maxAge} years` 
    };
  }
  
  if (this.eligibility.minSalary && customerSalary < this.eligibility.minSalary) {
    return { 
      eligible: false, 
      reason: `Minimum salary is ${this.eligibility.minSalary} RWF` 
    };
  }
  
  return { eligible: true };
};

const AccountProduct = mongoose.model('AccountProduct', accountProductSchema);

export default AccountProduct;

