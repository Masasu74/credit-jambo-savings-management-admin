import mongoose from 'mongoose';

const savingsAccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  accountType: {
    type: String,
    enum: ['regular', 'premium', 'fixed', 'youth', 'senior', 'business'],
    default: 'regular',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountProduct',
    required: false,
    index: true
  },
  productCode: {
    type: String,
    required: false,
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },
  minimumBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastTransactionDate: {
    type: Date,
    default: null
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
    required: false // Optional for customer-created accounts
  }
}, {
  timestamps: true
});

// Indexes for better performance
savingsAccountSchema.index({ customerId: 1, status: 1 });
savingsAccountSchema.index({ accountNumber: 1 });
savingsAccountSchema.index({ status: 1, createdAt: -1 });
savingsAccountSchema.index({ productId: 1, status: 1 });
// Unique constraint: A customer can only have one account per product (only when productId is set)
savingsAccountSchema.index({ customerId: 1, productId: 1 }, { unique: true, sparse: true });

// Pre-save middleware to generate account number
savingsAccountSchema.pre('save', async function(next) {
  if (this.isNew && !this.accountNumber) {
    // Generate account number: SAV + timestamp + random 4 digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.accountNumber = `SAV${timestamp}${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Instance method to check if withdrawal is allowed
// skipVerification: if true, skips the isVerified check (for customer-initiated transactions)
savingsAccountSchema.methods.canWithdraw = function(amount, skipVerification = false) {
  if (this.status !== 'active') {
    return { allowed: false, reason: 'Account is not active' };
  }
  
  if (!skipVerification && !this.isVerified) {
    return { allowed: false, reason: 'Account is not verified' };
  }
  
  if (amount <= 0) {
    return { allowed: false, reason: 'Invalid withdrawal amount' };
  }
  
  if (this.balance < amount) {
    return { allowed: false, reason: 'Insufficient balance' };
  }
  
  const remainingBalance = this.balance - amount;
  if (remainingBalance < this.minimumBalance) {
    return { allowed: false, reason: 'Withdrawal would violate minimum balance requirement' };
  }
  
  return { allowed: true };
};

// Instance method to check if deposit is allowed
savingsAccountSchema.methods.canDeposit = function(amount) {
  if (this.status !== 'active') {
    return { allowed: false, reason: 'Account is not active' };
  }
  
  if (amount <= 0) {
    return { allowed: false, reason: 'Invalid deposit amount' };
  }
  
  return { allowed: true };
};

// Static method to get account summary
savingsAccountSchema.statics.getAccountSummary = async function(customerId) {
  const accounts = await this.find({ 
    customerId, 
    status: { $in: ['active', 'suspended'] } 
  }).select('accountNumber accountType balance status createdAt');
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  return {
    accounts,
    totalBalance,
    accountCount: accounts.length
  };
};

// Static method to get low balance accounts
savingsAccountSchema.statics.getLowBalanceAccounts = async function(threshold = 1000) {
  return await this.find({
    status: 'active',
    balance: { $lt: threshold }
  }).populate('customerId', 'firstName lastName email phone');
};

const SavingsAccount = mongoose.model('SavingsAccount', savingsAccountSchema);

export default SavingsAccount;
