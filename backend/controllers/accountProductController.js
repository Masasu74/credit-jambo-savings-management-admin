import AccountProduct from '../models/accountProductModel.js';
import SavingsAccount from '../models/savingsAccountModel.js';

// Create new account product
export const createAccountProduct = async (req, res) => {
  try {
    const {
      productCode,
      productName,
      description,
      accountType,
      minimumDeposit,
      minimumBalance,
      monthlyFee,
      interestRate,
      interestFrequency,
      features,
      eligibility,
      depositLimits,
      displayOrder
    } = req.body;

    const createdBy = req.user.id;

    // Validate required fields
    if (!productCode || !productName || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'Product code, name, and account type are required'
      });
    }

    // Check if product code already exists
    const existingProduct = await AccountProduct.findOne({ 
      productCode: productCode.toUpperCase() 
    });
    
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product code already exists'
      });
    }

    // Create new product
    const product = new AccountProduct({
      productCode: productCode.toUpperCase(),
      productName,
      description,
      accountType,
      minimumDeposit: minimumDeposit || 0,
      minimumBalance: minimumBalance || 0,
      monthlyFee: monthlyFee || 0,
      interestRate: interestRate || 0,
      interestFrequency: interestFrequency || 'monthly',
      features: features || [],
      eligibility: eligibility || {},
      depositLimits: depositLimits || {},
      displayOrder: displayOrder || 0,
      createdBy
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Account product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating account product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account product',
      error: error.message
    });
  }
};

// Get all account products
export const getAccountProducts = async (req, res) => {
  try {
    const { activeOnly = 'false' } = req.query;
    
    let query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const products = await AccountProduct.find(query)
      .sort({ displayOrder: 1, productName: 1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching account products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account products',
      error: error.message
    });
  }
};

// Get single account product
export const getAccountProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AccountProduct.findById(id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Account product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching account product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account product',
      error: error.message
    });
  }
};

// Get active products only
export const getActiveAccountProducts = async (req, res) => {
  try {
    const products = await AccountProduct.getActiveProducts();

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching active account products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active account products',
      error: error.message
    });
  }
};

// Update account product
export const updateAccountProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent changing product code
    if (updateData.productCode) {
      delete updateData.productCode;
    }

    const product = await AccountProduct.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Account product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating account product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account product',
      error: error.message
    });
  }
};

// Toggle product status (activate/deactivate)
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AccountProduct.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Account product not found'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product status',
      error: error.message
    });
  }
};

// Delete account product (only if no accounts are using it)
export const deleteAccountProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any accounts are using this product
    const accountsUsingProduct = await SavingsAccount.countDocuments({ productId: id });

    if (accountsUsingProduct > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It is being used by ${accountsUsingProduct} account(s). Please deactivate instead.`
      });
    }

    const product = await AccountProduct.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Account product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account product',
      error: error.message
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const { id } = req.params;

    const accounts = await SavingsAccount.countDocuments({ productId: id });
    
    const accountsWithBalance = await SavingsAccount.countDocuments({
      productId: id,
      balance: { $gt: 0 }
    });

    res.status(200).json({
      success: true,
      data: {
        totalAccounts: accounts,
        accountsWithBalance,
        accountsWithoutBalance: accounts - accountsWithBalance
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics',
      error: error.message
    });
  }
};

