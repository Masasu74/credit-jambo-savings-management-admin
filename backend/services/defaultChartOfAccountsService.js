import ChartOfAccounts from '../models/chartOfAccountsModel.js';
import { logFinancialActivity } from '../utils/financialAuditTrail.js';

/**
 * Default Chart of Accounts Service
 * Provides standardized chart of accounts for new clients
 */
class DefaultChartOfAccountsService {
  
  /**
   * Available Chart of Accounts templates
   */
  static getTemplates() {
    return {
      'ndfsp': {
        name: 'NDFSP (Non-Deposit Taking Financial Service Provider)',
        description: 'Comprehensive chart for financial institutions',
        accounts: this.getNDFSPAccounts()
      },
      'ndfi': {
        name: 'NDFI (Non-Deposit Taking Financial Institution)',
        description: 'Standard chart for microfinance institutions',
        accounts: this.getNDFIAccounts()
      },
      'basic': {
        name: 'Basic Financial Institution',
        description: 'Simple chart for small financial institutions',
        accounts: this.getBasicAccounts()
      }
    };
  }

  /**
   * Create default chart of accounts for a new client
   * @param {string} clientName - Client identifier
   * @param {string} template - Template to use ('ndfsp', 'ndfi', 'basic')
   * @param {string} userId - User ID who initiated the setup
   * @param {string} branchId - Branch ID (optional)
   * @returns {Promise<Object>} Setup result
   */
  static async createDefaultChartOfAccounts(clientName, template = 'ndfsp', userId, branchId = null) {
    try {
      console.log(`🏗️ Creating default chart of accounts for ${clientName} using ${template} template`);

      // Check if accounts already exist for this client
      const existingAccounts = await ChartOfAccounts.countDocuments();
      if (existingAccounts > 0) {
        console.log('⚠️  Chart of accounts already exists for this client');
        return {
          success: false,
          message: 'Chart of accounts already exists',
          accountsCreated: 0
        };
      }

      const templates = this.getTemplates();
      const selectedTemplate = templates[template];
      
      if (!selectedTemplate) {
        throw new Error(`Invalid template: ${template}`);
      }

      const accounts = selectedTemplate.accounts;
      const createdAccounts = [];
      const accountMap = new Map();

      // First pass: create all accounts
      for (const accountData of accounts) {
        const account = new ChartOfAccounts({
          ...accountData,
          isActive: true,
          isSystemAccount: true,
          currentBalance: accountData.openingBalance || 0,
          currency: accountData.currency || 'RWF',
          createdBy: userId,
          branch: branchId,
          clientName: clientName // Track which client owns these accounts
        });
        
        await account.save();
        createdAccounts.push(account);
        accountMap.set(account.accountCode, account._id);
      }

      // Second pass: update parent relationships
      for (const account of createdAccounts) {
        if (account.parentCode) {
          const parentId = accountMap.get(account.parentCode);
          if (parentId) {
            account.parentAccount = parentId;
            await account.save();
          }
        }
      }

      // Log the activity
      await logFinancialActivity({
        userId,
        action: 'create_default_chart_of_accounts',
        entityType: 'chart_of_accounts',
        entityId: null,
        details: {
          clientName,
          template,
          accountsCreated: createdAccounts.length,
          templateName: selectedTemplate.name
        },
        branch: branchId,
        securityLevel: 'medium'
      });

      console.log(`✅ Chart of accounts created for ${clientName}: ${createdAccounts.length} accounts`);
      console.log(`📊 Template used: ${selectedTemplate.name}`);

      return {
        success: true,
        message: `Chart of accounts created successfully`,
        template: selectedTemplate.name,
        accountsCreated: createdAccounts.length,
        accounts: createdAccounts
      };

    } catch (error) {
      console.error('❌ Failed to create default chart of accounts:', error);
      throw error;
    }
  }

  /**
   * Get NDFSP (Non-Deposit Taking Financial Service Provider) accounts
   * This is the most comprehensive template
   */
  static getNDFSPAccounts() {
    return [
      // 1.0 CASH IN VAULTS
      { accountCode: '1.0', accountName: 'CASH IN VAULTS', accountType: 'asset', accountCategory: 'current_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.0.1', accountName: 'Cash in RWF currency', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1.0', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.0.1.1', accountName: 'Cash in Vaults at Headquarters', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '1.0.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.0.1.2', accountName: 'Petty cash', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '1.0.1', normalBalance: 'DE', currency: 'RWF' },

      // 1.1 ACCOUNT IN BANK AND OTHER FINANCIAL INSTITUTION
      { accountCode: '1.1', accountName: 'ACCOUNT IN BANK AND OTHER FINANCIAL INSTITUTION', accountType: 'asset', accountCategory: 'current_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.1.1', accountName: 'CURRENT ACCOUNT IN BANKS', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.1.1.1', accountName: 'Cash held with Central Bank', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '1.1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.1.1.2', accountName: 'Current account_BK', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '1.1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.1.1.3', accountName: 'Current account_Equity Bank', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '1.1.1', normalBalance: 'DE', currency: 'RWF' },

      // 1.2 SAVING ACCOUNTS
      { accountCode: '1.2', accountName: 'SAVING ACCOUNTS IN BANKS AND OTHER FINANCIAL INSTITUTIONS', accountType: 'asset', accountCategory: 'current_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.2.1', accountName: 'Saving Account _BK', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1.2', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '1.2.2', accountName: 'Saving account_Equity Bank', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1.2', normalBalance: 'DE', currency: 'RWF' },

      // 1.3 BORROWING ACCOUNTS
      { accountCode: '1.3', accountName: 'BORROWING ACCOUNTS', accountType: 'liability', accountCategory: 'current_liabilities', level: 1, parentCode: null, normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '1.3.1', accountName: 'Borrowings from Banks', accountType: 'liability', accountCategory: 'current_liabilities', level: 2, parentCode: '1.3', normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '1.3.2', accountName: 'Borrowings from other institutions', accountType: 'liability', accountCategory: 'current_liabilities', level: 2, parentCode: '1.3', normalBalance: 'CR', currency: 'RWF' },

      // 2.0 OPERATIONS WITH CUSTOMERS
      { accountCode: '2.0', accountName: 'OPERATIONS WITH CUSTOMERS', accountType: 'liability', accountCategory: 'current_liabilities', level: 1, parentCode: null, normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '2.0.1', accountName: 'REMBURSEMENT ACCOUNTS', accountType: 'liability', accountCategory: 'current_liabilities', level: 2, parentCode: '2.0', normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '2.0.1.4', accountName: 'Loan reimbursement account', accountType: 'liability', accountCategory: 'current_liabilities', level: 3, parentCode: '2.0.1', normalBalance: 'CR', currency: 'RWF' },

      // 2.1 LOANS OPERATIONS
      { accountCode: '2.1', accountName: 'LOANS OPERATIONS', accountType: 'asset', accountCategory: 'current_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.1.1', accountName: 'Current loans', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '2.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.1.1.1', accountName: 'Overdraft and Treasury Loans', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '2.1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.1.1.2', accountName: 'Equipment Loans', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '2.1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.1.1.3', accountName: 'Consumer Loans', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '2.1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.1.1.4', accountName: 'Mortgage Loans', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '2.1.1', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.1.1.5', accountName: 'Others Loans', accountType: 'asset', accountCategory: 'current_assets', level: 3, parentCode: '2.1.1', normalBalance: 'DE', currency: 'RWF' },

      // 2.7 ACCRUAL RECEIVABLE INTERESTS
      { accountCode: '2.7', accountName: 'ACCRUAL RECEIVABLE INTERESTS', accountType: 'asset', accountCategory: 'current_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.7.1', accountName: 'Accrual receivable interests on Loans', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '2.7', normalBalance: 'DE', currency: 'RWF' },

      // 2.9 DOUBTFUL, LITIGIOUS, CONTENTIOUS LOANS AND PROVISIONS
      { accountCode: '2.9', accountName: 'DOUBTFUL, LITIGIOUS, CONTENTIOUS LOANS AND PROVISIONS', accountType: 'asset', accountCategory: 'current_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.9.1', accountName: 'Watch loans', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '2.9', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.9.2', accountName: 'Substandard loans', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '2.9', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.9.3', accountName: 'Doubtful loans', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '2.9', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '2.9.4', accountName: 'Loss loans', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '2.9', normalBalance: 'DE', currency: 'RWF' },

      // 2.9.9 PROVISION ON LOANS
      { accountCode: '2.9.9', accountName: 'PROVISION ON LOANS', accountType: 'liability', accountCategory: 'current_liabilities', level: 1, parentCode: null, normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '2.9.9.1', accountName: 'Provisions on current loans', accountType: 'liability', accountCategory: 'current_liabilities', level: 2, parentCode: '2.9.9', normalBalance: 'CR', currency: 'RWF' },

      // 3.0 FIXED ASSETS
      { accountCode: '3.0', accountName: 'FIXED ASSETS', accountType: 'asset', accountCategory: 'fixed_assets', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '3.0.1', accountName: 'Land and Buildings', accountType: 'asset', accountCategory: 'fixed_assets', level: 2, parentCode: '3.0', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '3.0.2', accountName: 'Equipment and Furniture', accountType: 'asset', accountCategory: 'fixed_assets', level: 2, parentCode: '3.0', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '3.0.3', accountName: 'Vehicles', accountType: 'asset', accountCategory: 'fixed_assets', level: 2, parentCode: '3.0', normalBalance: 'DE', currency: 'RWF' },

      // 4.0 EQUITY
      { accountCode: '4.0', accountName: 'EQUITY', accountType: 'equity', accountCategory: 'shareholders_equity', level: 1, parentCode: null, normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '4.0.1', accountName: 'Share Capital', accountType: 'equity', accountCategory: 'shareholders_equity', level: 2, parentCode: '4.0', normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '4.0.2', accountName: 'Retained Earnings', accountType: 'equity', accountCategory: 'retained_earnings', level: 2, parentCode: '4.0', normalBalance: 'CR', currency: 'RWF' },

      // 5.0 REVENUE
      { accountCode: '5.0', accountName: 'REVENUE', accountType: 'revenue', accountCategory: 'operating_revenue', level: 1, parentCode: null, normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '5.0.1', accountName: 'Interest Income', accountType: 'revenue', accountCategory: 'operating_revenue', level: 2, parentCode: '5.0', normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '5.0.2', accountName: 'Fee Income', accountType: 'revenue', accountCategory: 'operating_revenue', level: 2, parentCode: '5.0', normalBalance: 'CR', currency: 'RWF' },
      { accountCode: '5.0.3', accountName: 'Other Income', accountType: 'revenue', accountCategory: 'non_operating_revenue', level: 2, parentCode: '5.0', normalBalance: 'CR', currency: 'RWF' },

      // 6.0 EXPENSES
      { accountCode: '6.0', accountName: 'EXPENSES', accountType: 'expense', accountCategory: 'operating_expenses', level: 1, parentCode: null, normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '6.0.1', accountName: 'Interest Expense', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6.0', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '6.0.2', accountName: 'Personnel Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6.0', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '6.0.3', accountName: 'Administrative Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6.0', normalBalance: 'DE', currency: 'RWF' },
      { accountCode: '6.0.4', accountName: 'Depreciation Expense', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6.0', normalBalance: 'DE', currency: 'RWF' }
    ];
  }

  /**
   * Get NDFI (Non-Deposit Taking Financial Institution) accounts
   * Standard template for microfinance institutions
   */
  static getNDFIAccounts() {
    return [
      // ASSETS
      { accountCode: '1100', accountName: 'Cash and Cash Equivalents', accountType: 'asset', accountCategory: 'current_assets', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '1200', accountName: 'Loans Receivable', accountType: 'asset', accountCategory: 'current_assets', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '1300', accountName: 'Interest Receivable', accountType: 'asset', accountCategory: 'current_assets', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '1400', accountName: 'Prepaid Expenses', accountType: 'asset', accountCategory: 'current_assets', level: 1, openingBalance: 0, isActive: true },
      
      { accountCode: '2100', accountName: 'Equipment', accountType: 'asset', accountCategory: 'fixed_assets', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '2200', accountName: 'Vehicles', accountType: 'asset', accountCategory: 'fixed_assets', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '2300', accountName: 'Accumulated Depreciation', accountType: 'asset', accountCategory: 'fixed_assets', level: 1, openingBalance: 0, isActive: true },

      // LIABILITIES
      { accountCode: '3100', accountName: 'Accounts Payable', accountType: 'liability', accountCategory: 'current_liabilities', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '3200', accountName: 'Accrued Expenses', accountType: 'liability', accountCategory: 'current_liabilities', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '3300', accountName: 'Borrowings', accountType: 'liability', accountCategory: 'current_liabilities', level: 1, openingBalance: 0, isActive: true },

      // EQUITY
      { accountCode: '4100', accountName: 'Share Capital', accountType: 'equity', accountCategory: 'shareholders_equity', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '4200', accountName: 'Retained Earnings', accountType: 'equity', accountCategory: 'retained_earnings', level: 1, openingBalance: 0, isActive: true },

      // REVENUE
      { accountCode: '5100', accountName: 'Interest Income', accountType: 'revenue', accountCategory: 'operating_revenue', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '5200', accountName: 'Fee Income', accountType: 'revenue', accountCategory: 'operating_revenue', level: 1, openingBalance: 0, isActive: true },

      // EXPENSES
      { accountCode: '6100', accountName: 'Interest Expense', accountType: 'expense', accountCategory: 'operating_expenses', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '6200', accountName: 'Personnel Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 1, openingBalance: 0, isActive: true },
      { accountCode: '6300', accountName: 'Administrative Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 1, openingBalance: 0, isActive: true }
    ];
  }

  /**
   * Get Basic accounts for small financial institutions
   */
  static getBasicAccounts() {
    return [
      // Assets
      { accountCode: '1000', accountName: 'Current Assets', accountType: 'asset', accountCategory: 'current_assets', level: 1 },
      { accountCode: '1100', accountName: 'Cash and Cash Equivalents', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1000' },
      { accountCode: '1200', accountName: 'Accounts Receivable', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1000' },
      { accountCode: '1300', accountName: 'Loans Receivable', accountType: 'asset', accountCategory: 'current_assets', level: 2, parentCode: '1000' },
      
      { accountCode: '2000', accountName: 'Fixed Assets', accountType: 'asset', accountCategory: 'fixed_assets', level: 1 },
      { accountCode: '2100', accountName: 'Equipment', accountType: 'asset', accountCategory: 'fixed_assets', level: 2, parentCode: '2000' },
      { accountCode: '2200', accountName: 'Buildings', accountType: 'asset', accountCategory: 'fixed_assets', level: 2, parentCode: '2000' },
      
      // Liabilities
      { accountCode: '3000', accountName: 'Current Liabilities', accountType: 'liability', accountCategory: 'current_liabilities', level: 1 },
      { accountCode: '3100', accountName: 'Accounts Payable', accountType: 'liability', accountCategory: 'current_liabilities', level: 2, parentCode: '3000' },
      { accountCode: '3200', accountName: 'Accrued Expenses', accountType: 'liability', accountCategory: 'current_liabilities', level: 2, parentCode: '3000' },
      
      // Equity
      { accountCode: '4000', accountName: 'Equity', accountType: 'equity', accountCategory: 'shareholders_equity', level: 1 },
      { accountCode: '4100', accountName: 'Share Capital', accountType: 'equity', accountCategory: 'shareholders_equity', level: 2, parentCode: '4000' },
      { accountCode: '4200', accountName: 'Retained Earnings', accountType: 'equity', accountCategory: 'retained_earnings', level: 2, parentCode: '4000' },
      
      // Revenue
      { accountCode: '5000', accountName: 'Revenue', accountType: 'revenue', accountCategory: 'operating_revenue', level: 1 },
      { accountCode: '5100', accountName: 'Interest Income', accountType: 'revenue', accountCategory: 'operating_revenue', level: 2, parentCode: '5000' },
      { accountCode: '5200', accountName: 'Fee Income', accountType: 'revenue', accountCategory: 'operating_revenue', level: 2, parentCode: '5000' },
      
      // Expenses
      { accountCode: '6000', accountName: 'Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 1 },
      { accountCode: '6100', accountName: 'Interest Expense', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6000' },
      { accountCode: '6200', accountName: 'Personnel Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6000' },
      { accountCode: '6300', accountName: 'Administrative Expenses', accountType: 'expense', accountCategory: 'operating_expenses', level: 2, parentCode: '6000' }
    ];
  }

  /**
   * Get template information for frontend display
   * @returns {Array} Template information
   */
  static getTemplateInfo() {
    const templates = this.getTemplates();
    return Object.keys(templates).map(key => ({
      id: key,
      name: templates[key].name,
      description: templates[key].description,
      accountCount: templates[key].accounts.length
    }));
  }
}

export default DefaultChartOfAccountsService;
