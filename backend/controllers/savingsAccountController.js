import SavingsAccount from '../models/savingsAccountModel.js';
import Customer from '../models/customerModel.js';
import Transaction from '../models/transactionModel.js';
import AccountProduct from '../models/accountProductModel.js';
import { 
  savingsAccountSummaryDTO, 
  savingsAccountDetailsDTO, 
  savingsAccountWithCustomerDTO,
  savingsAccountListDTO,
  savingsAccountStatsDTO,
  accountSummaryDTO
} from '../dtos/savingsAccountDTO.js';
import { transactionSummaryDTO } from '../dtos/transactionDTO.js';

// Create a new savings account
export const createSavingsAccount = async (req, res) => {
  try {
    const { customerId, productId, accountType = 'regular', minimumBalance, interestRate } = req.body;
    const createdBy = req.user.id;

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get product details if productId is provided
    let product = null;
    if (productId) {
      product = await AccountProduct.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Account product not found'
        });
      }
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'This account product is not active'
        });
      }
    }

    // Check if customer already has an account for this product
    if (productId) {
      const existingAccount = await SavingsAccount.findOne({ 
        customerId, 
        productId 
      });
      
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: 'Customer already has an account for this product'
        });
      }
    }

    // Use product settings or provided values
    const finalMinimumBalance = minimumBalance !== undefined ? minimumBalance : (product?.minimumBalance || 0);
    const finalInterestRate = interestRate !== undefined ? interestRate : (product?.interestRate || 0);

    // Create new savings account
    const savingsAccount = new SavingsAccount({
      customerId,
      productId: productId || null,
      productCode: product?.productCode || '',
      accountType,
      minimumBalance: finalMinimumBalance,
      interestRate: finalInterestRate,
      createdBy
    });

    await savingsAccount.save();

    res.status(201).json({
      success: true,
      message: 'Savings account created successfully',
      data: savingsAccountDetailsDTO(savingsAccount)
    });
  } catch (error) {
    console.error('Error creating savings account:', error);
    
    // Handle duplicate product account error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer already has an account for this product'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create savings account',
      error: error.message
    });
  }
};

// Get all savings accounts with pagination
export const getSavingsAccounts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const accountType = req.query.accountType;
    const search = req.query.search;

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (accountType) query.accountType = accountType;

    // Search by account number or customer name
    if (search) {
      const customers = await Customer.find({
        $or: [
          { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
          { customerCode: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.customerId = { $in: customers.map(c => c._id) };
    }

    const accounts = await SavingsAccount.find(query)
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone')
      .populate('productId', 'productCode productName accountType interestRate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SavingsAccount.countDocuments(query);

    res.json({
      success: true,
      data: savingsAccountListDTO(accounts, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      })
    });
  } catch (error) {
    console.error('Error fetching savings accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings accounts',
      error: error.message
    });
  }
};

// Get savings account by ID
export const getSavingsAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await SavingsAccount.findById(id)
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    res.json({
      success: true,
      data: savingsAccountWithCustomerDTO(account, account.customerId)
    });
  } catch (error) {
    console.error('Error fetching savings account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings account',
      error: error.message
    });
  }
};

// Get all savings accounts by customer ID (supports multiple accounts per customer)
export const getSavingsAccountByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const accounts = await SavingsAccount.find({ customerId })
      .populate('customerId', 'customerCode personalInfo.fullName contact.email contact.phone')
      .populate('productId', 'productCode productName accountType interestRate minimumBalance features')
      .sort({ createdAt: -1 });

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No savings accounts found for this customer'
      });
    }

    res.json({
      success: true,
      data: accounts.map(account => savingsAccountWithCustomerDTO(account, account.customerId))
    });
  } catch (error) {
    console.error('Error fetching customer savings accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer savings accounts',
      error: error.message
    });
  }
};

// Update savings account
export const updateSavingsAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountType, minimumBalance, interestRate, status } = req.body;

    const account = await SavingsAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    // Update fields
    if (accountType) account.accountType = accountType;
    if (minimumBalance !== undefined) account.minimumBalance = minimumBalance;
    if (interestRate !== undefined) account.interestRate = interestRate;
    if (status) account.status = status;

    await account.save();

    res.json({
      success: true,
      message: 'Savings account updated successfully',
      data: savingsAccountDetailsDTO(account)
    });
  } catch (error) {
    console.error('Error updating savings account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update savings account',
      error: error.message
    });
  }
};

// Verify savings account
export const verifySavingsAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await SavingsAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    account.isVerified = true;
    await account.save();

    // Update customer device verification status
    await Customer.findByIdAndUpdate(account.customerId, { deviceVerified: true });

    res.json({
      success: true,
      message: 'Savings account verified successfully',
      data: savingsAccountDetailsDTO(account)
    });
  } catch (error) {
    console.error('Error verifying savings account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify savings account',
      error: error.message
    });
  }
};

// Get account transaction history
export const getAccountTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const account = await SavingsAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    const history = await Transaction.getTransactionHistory(id, page, limit);

    res.json({
      success: true,
      data: {
        transactions: history.transactions.map(transactionSummaryDTO),
        pagination: history.pagination
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

// Get low balance accounts
export const getLowBalanceAccounts = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 1000;

    const accounts = await SavingsAccount.getLowBalanceAccounts(threshold);

    res.json({
      success: true,
      data: accounts.map(account => savingsAccountWithCustomerDTO(account, account.customerId))
    });
  } catch (error) {
    console.error('Error fetching low balance accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low balance accounts',
      error: error.message
    });
  }
};

// Get savings account statistics
export const getSavingsAccountStats = async (req, res) => {
  try {
    const total = await SavingsAccount.countDocuments();
    const active = await SavingsAccount.countDocuments({ status: 'active' });
    const verified = await SavingsAccount.countDocuments({ isVerified: true });
    
    const balanceStats = await SavingsAccount.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          averageBalance: { $avg: '$balance' },
          minBalance: { $min: '$balance' },
          maxBalance: { $max: '$balance' }
        }
      }
    ]);

    const lowBalanceCount = await SavingsAccount.countDocuments({
      status: 'active',
      balance: { $lt: 1000 }
    });

    // Get transaction stats
    const transactionStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalDeposits: {
            $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
          },
          totalWithdrawals: {
            $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const stats = {
      total,
      active,
      verified,
      totalBalance: balanceStats[0]?.totalBalance || 0,
      averageBalance: balanceStats[0]?.averageBalance || 0,
      lowBalanceAccounts: lowBalanceCount,
      totalDeposits: transactionStats[0]?.totalDeposits || 0,
      totalWithdrawals: transactionStats[0]?.totalWithdrawals || 0
    };

    res.json({
      success: true,
      data: savingsAccountStatsDTO(stats)
    });
  } catch (error) {
    console.error('Error fetching savings account statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch savings account statistics',
      error: error.message
    });
  }
};

// Get customer account summary
export const getCustomerAccountSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    const summary = await SavingsAccount.getAccountSummary(customerId);

    res.json({
      success: true,
      data: accountSummaryDTO(summary)
    });
  } catch (error) {
    console.error('Error fetching customer account summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer account summary',
      error: error.message
    });
  }
};
