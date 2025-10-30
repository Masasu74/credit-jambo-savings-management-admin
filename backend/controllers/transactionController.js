import Transaction from '../models/transactionModel.js';
import SavingsAccount from '../models/savingsAccountModel.js';
import Customer from '../models/customerModel.js';
import { 
  transactionSummaryDTO, 
  transactionDetailsDTO,
  transactionWithAccountDTO,
  transactionListDTO,
  transactionStatsDTO,
  dailyTransactionReportDTO,
  transactionHistoryDTO
} from '../dtos/transactionDTO.js';

// Process deposit transaction
export const processDeposit = async (req, res) => {
  try {
    const { accountId, amount, description, reference } = req.body;
    const processedBy = req.user.id;
    const deviceId = req.headers['x-device-id'] || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deposit amount'
      });
    }

    // Find savings account
    const account = await SavingsAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    // Check if deposit is allowed
    const canDeposit = account.canDeposit(amount);
    if (!canDeposit.allowed) {
      return res.status(400).json({
        success: false,
        message: canDeposit.reason
      });
    }

    // Get customer
    const customer = await Customer.findById(account.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update account balance
    const balanceBefore = account.balance;
    account.balance += amount;
    account.lastTransactionDate = new Date();
    await account.save();

    // Create transaction record
    const transaction = new Transaction({
      accountId,
      customerId: account.customerId,
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || 'Deposit transaction',
      reference,
      processedBy,
      deviceId,
      ipAddress,
      userAgent,
      status: 'completed'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Deposit processed successfully',
      data: {
        transaction: transactionDetailsDTO(transaction),
        newBalance: account.balance
      }
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process deposit',
      error: error.message
    });
  }
};

// Process withdrawal transaction
export const processWithdrawal = async (req, res) => {
  try {
    const { accountId, amount, description, reference } = req.body;
    const processedBy = req.user.id;
    const deviceId = req.headers['x-device-id'] || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }

    // Find savings account
    const account = await SavingsAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    // Check if withdrawal is allowed
    const canWithdraw = account.canWithdraw(amount);
    if (!canWithdraw.allowed) {
      return res.status(400).json({
        success: false,
        message: canWithdraw.reason
      });
    }

    // Get customer
    const customer = await Customer.findById(account.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update account balance
    const balanceBefore = account.balance;
    account.balance -= amount;
    account.lastTransactionDate = new Date();
    await account.save();

    // Create transaction record
    const transaction = new Transaction({
      accountId,
      customerId: account.customerId,
      type: 'withdrawal',
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || 'Withdrawal transaction',
      reference,
      processedBy,
      deviceId,
      ipAddress,
      userAgent,
      status: 'completed'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        transaction: transactionDetailsDTO(transaction),
        newBalance: account.balance
      }
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('accountId', 'accountNumber accountType')
      .populate('customerId', 'customerCode personalInfo.fullName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transactionDetailsDTO(transaction)
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
};

// Get all transactions with pagination and filters
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const status = req.query.status;
    const accountId = req.query.accountId;
    const customerId = req.query.customerId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const skip = (page - 1) * limit;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (accountId) query.accountId = accountId;
    if (customerId) query.customerId = customerId;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .populate('accountId', 'accountNumber accountType')
      .populate('customerId', 'customerCode personalInfo.fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactionListDTO(transactions, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      })
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

// Get transaction history for an account
export const getAccountTransactionHistory = async (req, res) => {
  try {
    const { accountId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const account = await SavingsAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    const history = await Transaction.getTransactionHistory(accountId, page, limit);

    res.json({
      success: true,
      data: transactionHistoryDTO(history)
    });
  } catch (error) {
    console.error('Error fetching account transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account transaction history',
      error: error.message
    });
  }
};

// Get customer transaction summary
export const getCustomerTransactionSummary = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const summary = await Transaction.getCustomerTransactionSummary(
      customerId, 
      startDate, 
      endDate
    );

    res.json({
      success: true,
      data: transactionStatsDTO(summary)
    });
  } catch (error) {
    console.error('Error fetching customer transaction summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer transaction summary',
      error: error.message
    });
  }
};

// Get daily transaction report
export const getDailyTransactionReport = async (req, res) => {
  try {
    const { date } = req.params;

    const report = await Transaction.getDailyTransactionReport(date);

    res.json({
      success: true,
      data: dailyTransactionReportDTO(report)
    });
  } catch (error) {
    console.error('Error fetching daily transaction report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily transaction report',
      error: error.message
    });
  }
};

// Get transaction statistics
export const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          deposits: {
            $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, 1, 0] }
          },
          withdrawals: {
            $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, 1, 0] }
          },
          depositAmount: {
            $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
          },
          withdrawalAmount: {
            $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      avgAmount: 0,
      deposits: 0,
      withdrawals: 0,
      depositAmount: 0,
      withdrawalAmount: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching transaction statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message
    });
  }
};

// Cancel transaction (admin only)
export const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed transactions can be cancelled'
      });
    }

    // Reverse the transaction
    const account = await SavingsAccount.findById(transaction.accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    // Update account balance
    if (transaction.type === 'deposit') {
      account.balance -= transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      account.balance += transaction.amount;
    }

    await account.save();

    // Update transaction status
    transaction.status = 'cancelled';
    transaction.metadata = { ...transaction.metadata, cancellationReason: reason };
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: transactionDetailsDTO(transaction)
    });
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel transaction',
      error: error.message
    });
  }
};

// Get recent transactions
export const getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const transactions = await Transaction.find()
      .populate('accountId', 'accountNumber accountType')
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Map transactions to include necessary fields
    const mappedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      transactionId: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      description: transaction.description,
      status: transaction.status,
      createdAt: transaction.createdAt,
      customer: transaction.customerId ? {
        fullName: transaction.customerId.personalInfo?.fullName,
        email: transaction.customerId.contact?.email,
        phone: transaction.customerId.contact?.phone,
        customerCode: transaction.customerId.customerCode
      } : null,
      customerId: transaction.customerId,
      account: transaction.accountId ? {
        accountNumber: transaction.accountId.accountNumber,
        accountType: transaction.accountId.accountType
      } : null
    }));

    res.json({
      success: true,
      data: mappedTransactions
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent transactions',
      error: error.message
    });
  }
};
