import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: function() {
      const timestamp = Date.now().toString().slice(-10);
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `TXN${timestamp}${random}`;
    }
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsAccount',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'interest', 'fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceBefore: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  reference: {
    type: String,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
transactionSchema.index({ accountId: 1, createdAt: -1 });
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ transactionId: 1 });

// Keep updatedAt fresh on save
transactionSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to get transaction summary
transactionSchema.methods.getSummary = function() {
  return {
    transactionId: this.transactionId,
    type: this.type,
    amount: this.amount,
    balanceAfter: this.balanceAfter,
    description: this.description,
    status: this.status,
    createdAt: this.createdAt
  };
};

// Static method to get transaction history
transactionSchema.statics.getTransactionHistory = async function(accountId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const transactions = await this.find({ accountId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('transactionId type amount balanceAfter description status createdAt');
  
  const total = await this.countDocuments({ accountId });
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get customer transaction summary
transactionSchema.statics.getCustomerTransactionSummary = async function(customerId, startDate, endDate) {
  const matchQuery = { customerId };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  const totalTransactions = await this.countDocuments(matchQuery);
  const totalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);
  
  return {
    summary,
    totalTransactions,
    totalAmount,
    period: { startDate, endDate }
  };
};

// Static method to get daily transaction report
transactionSchema.statics.getDailyTransactionReport = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const transactions = await this.find({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate('accountId', 'accountNumber').populate('customerId', 'firstName lastName');
  
  const summary = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  return {
    date,
    transactions,
    summary,
    totalTransactions: transactions.length
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
