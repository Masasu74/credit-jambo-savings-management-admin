import GeneralLedger from '../models/generalLedgerModel.js';
import ChartOfAccounts from '../models/chartOfAccountsModel.js';
import { logActivity } from '../utils/logActivity.js';

/**
 * Enhanced Financial Integration Service
 * Connects financial management with all system components
 */
class EnhancedFinancialIntegrationService {
  
  // ==================== LOAN MANAGEMENT INTEGRATION ====================
  
  /**
   * Record loan disbursement with enhanced NDFSP account mapping
   */
  static async recordLoanDisbursement(loan, userId) {
    try {
      console.log(`💰 Recording loan disbursement: ${loan.loanCode} - ${loan.disbursedAmount} RWF`);
      
      // Handle system user ID - create a valid ObjectId if needed
      let validUserId = userId;
      if (userId === 'system' || !userId) {
        // Use a default system user ID or create one
        const mongoose = (await import('mongoose')).default;
        validUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Default system user ID
      }

      // Get NDFSP-specific accounts based on loan type
      const loanTypeMapping = {
        'Overdraft and Treasury Loans': '2.1.1.1',
        'Equipment Loans': '2.1.1.2', 
        'Consumer Loans': '2.1.1.3',
        'Mortgage Loans': '2.1.1.4',
        'Others Loans': '2.1.1.5'
      };

      // Get loan product to determine account mapping
      let loanProduct = null;
      let targetLoanAccount = null;
      
      if (loan.product) {
        const LoanProduct = (await import('../models/loanProductModel.js')).default;
        loanProduct = await LoanProduct.findById(loan.product);
        
        if (loanProduct) {
          // Map product category to NDFSP account
          const productCategory = loanProduct.category || loanProduct.name;
          const accountCode = loanTypeMapping[productCategory] || '2.1.1.5'; // Default to Others Loans
          targetLoanAccount = await ChartOfAccounts.findOne({ accountCode });
        }
      }

      // Fallback to general loan account if specific account not found
      if (!targetLoanAccount) {
        // Try NDFSP format first
        targetLoanAccount = await ChartOfAccounts.findOne({ accountCode: '2.1.1.5' }); // Others Loans
        if (!targetLoanAccount) {
          // Fallback to basic format
          targetLoanAccount = await ChartOfAccounts.findOne({ accountCode: '1200' }); // Accounts Receivable
        }
      }

      // Try NDFSP format first, then fallback to basic format
      let cashAccount = await ChartOfAccounts.findOne({ accountCode: '1.0.1.1' }); // Cash in Vaults at Headquarters
      if (!cashAccount) {
        // Fallback to basic format
        cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' }); // Cash and Cash Equivalents
      }
      
      let feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '7.4.6.1' }); // Loan application fees
      if (!feeIncomeAccount) {
        // Fallback to basic format
        feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6000' }); // Operating Revenue
      }

      if (!targetLoanAccount || !cashAccount) {
        throw new Error('Required Chart of Accounts not found for loan disbursement');
      }

      // Calculate fees - temporarily disabled to fix double-entry balance
      let totalFees = 0;
      // if (loanProduct && typeof loanProduct.calculateTotalFees === 'function') {
      //   totalFees = loanProduct.calculateTotalFees(loan.disbursedAmount);
      // }

      // Ensure amounts are numbers and properly rounded
      const disbursedAmount = Number(loan.disbursedAmount || loan.amount || 0);
      const feeAmount = Number(totalFees || 0);

      // Create entries array
      const entries = [
        {
          account: targetLoanAccount._id,
          debit: disbursedAmount,
          credit: 0,
          balance: disbursedAmount
        }
      ];

      // Add fee income entry if fees exist
      if (feeAmount > 0 && feeIncomeAccount) {
        entries.push({
          account: feeIncomeAccount._id,
          debit: 0,
          credit: feeAmount,
          balance: -feeAmount
        });
      }

      // Add cash account entry (total cash outflow = disbursed amount + fees)
      entries.push({
        account: cashAccount._id,
        debit: 0,
        credit: disbursedAmount + feeAmount,
        balance: -(disbursedAmount + feeAmount)
      });

      // Calculate totals with proper rounding
      const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);

      // Validate debits equal credits (with small tolerance for rounding)
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Debits (${totalDebit}) and credits (${totalCredit}) must be equal`);
      }

      const transaction = new GeneralLedger({
        transactionDate: loan.disbursementDate || new Date(),
        reference: `LOAN-DISB-${loan.loanCode}`,
        referenceType: 'loan',
        referenceId: loan._id,
        description: `Loan disbursement - ${loan.loanCode} (${loanProduct?.name || 'Unknown Product'})`,
        entries: entries,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: validUserId,
        status: 'posted'
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(targetLoanAccount._id, loan.disbursedAmount, 'debit');
      await this.updateAccountBalance(cashAccount._id, loan.disbursedAmount, 'credit');
      if (totalFees > 0 && feeIncomeAccount) {
        await this.updateAccountBalance(feeIncomeAccount._id, totalFees, 'credit');
      }

      // Log activity
      await logActivity({
        userId,
        action: 'loan_disbursement_recorded',
        entityType: 'loan',
        entityId: loan._id,
        details: {
          loanCode: loan.loanCode,
          disbursedAmount: loan.disbursedAmount,
          totalFees,
          accountCode: targetLoanAccount.accountCode
        }
      });

      console.log(`✅ Loan disbursement recorded: ${loan.disbursedAmount} RWF to account ${targetLoanAccount.accountCode}`);
      return transaction;

    } catch (error) {
      console.error('Error recording loan disbursement:', error);
      throw error;
    }
  }

  /**
   * Record loan payment with interest and penalty tracking
   */
  static async recordLoanPayment(loan, paymentAmount, paymentType, userId) {
    try {
      console.log(`💰 Recording loan payment: ${loan.loanCode} - ${paymentAmount} RWF (${paymentType})`);
      
      // Get accounts based on payment type
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1.0.1.1' }); // Cash in Vaults
      const interestIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '7.1.1.1' }); // Interest Income
      const penaltyIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '7.1.1.7' }); // Penalty Income
      
      // Get loan account based on loan type
      const loanAccount = await this.getLoanAccountByType(loan);

      if (!cashAccount || !loanAccount) {
        throw new Error('Required Chart of Accounts not found for loan payment');
      }

      // Calculate payment breakdown (simplified - in real system, this would be more complex)
      const interestAmount = paymentType === 'interest' ? paymentAmount : paymentAmount * 0.1; // 10% interest
      const principalAmount = paymentAmount - interestAmount;
      const penaltyAmount = paymentType === 'penalty' ? paymentAmount : 0;

      const transaction = new GeneralLedger({
        transactionDate: new Date(),
        reference: `LOAN-PAY-${loan.loanCode}`,
        referenceType: 'loan_payment',
        referenceId: loan._id,
        description: `Loan payment - ${loan.loanCode} (${paymentType})`,
        entries: [
          {
            account: cashAccount._id,
            debit: paymentAmount,
            credit: 0
          },
          {
            account: loanAccount._id,
            debit: 0,
            credit: principalAmount
          }
        ],
        totalDebit: paymentAmount,
        totalCredit: paymentAmount,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: userId
      });

      // Add interest income entry
      if (interestAmount > 0 && interestIncomeAccount) {
        transaction.entries.push({
          account: interestIncomeAccount._id,
          debit: 0,
          credit: interestAmount
        });
      }

      // Add penalty income entry
      if (penaltyAmount > 0 && penaltyIncomeAccount) {
        transaction.entries.push({
          account: penaltyIncomeAccount._id,
          debit: 0,
          credit: penaltyAmount
        });
      }

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(cashAccount._id, paymentAmount, 'debit');
      await this.updateAccountBalance(loanAccount._id, principalAmount, 'credit');
      if (interestAmount > 0 && interestIncomeAccount) {
        await this.updateAccountBalance(interestIncomeAccount._id, interestAmount, 'credit');
      }
      if (penaltyAmount > 0 && penaltyIncomeAccount) {
        await this.updateAccountBalance(penaltyIncomeAccount._id, penaltyAmount, 'credit');
      }

      console.log(`✅ Loan payment recorded: ${paymentAmount} RWF`);
      return transaction;

    } catch (error) {
      console.error('Error recording loan payment:', error);
      throw error;
    }
  }

  // ==================== CUSTOMER MANAGEMENT INTEGRATION ====================
  
  /**
   * Record customer account opening fees
   */
  static async recordCustomerAccountOpening(customer, feeAmount, userId) {
    try {
      console.log(`💰 Recording customer account opening: ${customer.customerCode} - ${feeAmount} RWF`);
      
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1.0.1.1' });
      const feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '7.4.6.3' }); // Other service commissions

      if (!cashAccount || !feeIncomeAccount) {
        throw new Error('Required Chart of Accounts not found for customer account opening');
      }

      const transaction = new GeneralLedger({
        transactionDate: new Date(),
        reference: `CUST-OPEN-${customer.customerCode}`,
        referenceType: 'customer',
        referenceId: customer._id,
        description: `Customer account opening fee - ${customer.customerCode}`,
        entries: [
          {
            account: cashAccount._id,
            debit: feeAmount,
            credit: 0
          },
          {
            account: feeIncomeAccount._id,
            debit: 0,
            credit: feeAmount
          }
        ],
        totalDebit: feeAmount,
        totalCredit: feeAmount,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: customer.branch,
        createdBy: userId
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(cashAccount._id, feeAmount, 'debit');
      await this.updateAccountBalance(feeIncomeAccount._id, feeAmount, 'credit');

      console.log(`✅ Customer account opening recorded: ${feeAmount} RWF`);
      return transaction;

    } catch (error) {
      console.error('Error recording customer account opening:', error);
      throw error;
    }
  }

  // ==================== EMPLOYEE MANAGEMENT INTEGRATION ====================
  
  /**
   * Record salary payment
   */
  static async recordSalaryPayment(employee, salaryData, userId) {
    try {
      console.log(`💰 Recording salary payment: ${employee.employeeId} - ${salaryData.totalAmount || salaryData.salaryInfo?.baseSalary} RWF`);
      
      // Handle system user ID - create a valid ObjectId if needed
      let validUserId = userId;
      if (userId === 'system' || !userId) {
        // Use a default system user ID or create one
        const mongoose = (await import('mongoose')).default;
        validUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Default system user ID
      }
      
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1.0.1.1' });
      const salaryExpenseAccount = await ChartOfAccounts.findOne({ accountCode: '6.6.1.1' }); // Net salary
      const taxPayableAccount = await ChartOfAccounts.findOne({ accountCode: '4.5.1.1' }); // RRA Tax due
      const rssbPayableAccount = await ChartOfAccounts.findOne({ accountCode: '4.5.1.3' }); // RSSB contribution due

      if (!cashAccount || !salaryExpenseAccount) {
        throw new Error('Required Chart of Accounts not found for salary payment');
      }

      // Ensure amounts are numbers and properly rounded
      const grossAmount = Number(salaryData.salaryInfo?.baseSalary || salaryData.grossAmount || 0);
      const netAmount = Number(salaryData.salaryInfo?.netSalary || salaryData.netAmount || 0);
      const taxAmount = Number(salaryData.salaryInfo?.taxDeduction || salaryData.taxAmount || 0);
      const rssbAmount = Number(salaryData.salaryInfo?.rssbDeduction || salaryData.rssbAmount || 0);

      // Create entries array
      const entries = [
        {
          account: salaryExpenseAccount._id,
          debit: grossAmount,
          credit: 0,
          balance: grossAmount
        },
        {
          account: cashAccount._id,
          debit: 0,
          credit: netAmount,
          balance: -netAmount
        }
      ];

      // Add tax deduction entry
      if (taxAmount > 0 && taxPayableAccount) {
        entries.push({
          account: taxPayableAccount._id,
          debit: 0,
          credit: taxAmount,
          balance: -taxAmount
        });
      }

      // Add RSSB deduction entry
      if (rssbAmount > 0 && rssbPayableAccount) {
        entries.push({
          account: rssbPayableAccount._id,
          debit: 0,
          credit: rssbAmount,
          balance: -rssbAmount
        });
      }

      // Calculate totals with proper rounding
      const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);

      // Validate debits equal credits (with small tolerance for rounding)
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Debits (${totalDebit}) and credits (${totalCredit}) must be equal`);
      }

      const transaction = new GeneralLedger({
        transactionDate: new Date(),
        reference: `SALARY-${employee.employeeId}`,
        referenceType: 'salary',
        referenceId: salaryData._id,
        description: `Salary payment - ${employee.employeeId} (${employee.position})`,
        entries: entries,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: employee.branch,
        createdBy: validUserId,
        status: 'posted'
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(salaryExpenseAccount._id, salaryData.grossAmount, 'debit');
      await this.updateAccountBalance(cashAccount._id, salaryData.netAmount, 'credit');
      if (salaryData.taxAmount > 0 && taxPayableAccount) {
        await this.updateAccountBalance(taxPayableAccount._id, salaryData.taxAmount, 'credit');
      }
      if (salaryData.rssbAmount > 0 && rssbPayableAccount) {
        await this.updateAccountBalance(rssbPayableAccount._id, salaryData.rssbAmount, 'credit');
      }

      console.log(`✅ Salary payment recorded: ${salaryData.totalAmount} RWF`);
      return transaction;

    } catch (error) {
      console.error('Error recording salary payment:', error);
      throw error;
    }
  }

  // ==================== EXPENSE MANAGEMENT INTEGRATION ====================
  
  /**
   * Record expense with enhanced NDFSP account mapping
   */
  static async recordExpense(expense, userId) {
    try {
      console.log(`💰 Recording expense: ${expense.title} - ${expense.amount} RWF`);
      
      // Handle system user ID - create a valid ObjectId if needed
      let validUserId = userId;
      if (userId === 'system' || !userId) {
        // Use a default system user ID or create one
        const mongoose = (await import('mongoose')).default;
        validUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Default system user ID
      }
      
      // Try NDFSP format first, then fallback to basic format
      let cashAccount = await ChartOfAccounts.findOne({ accountCode: '1.0.1.1' });
      if (!cashAccount) {
        // Fallback to basic format
        cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' }); // Cash and Cash Equivalents
      }
      
      // Map expense categories to accounts (try NDFSP first, then basic)
      const expenseAccountMapping = {
        'Office Supplies': ['6.6.5.22', '7000'], // NDFSP: Office supplies, Basic: Operating Expenses
        'Travel & Transportation': ['6.6.5.17', '7000'], // NDFSP: Transport, Basic: Operating Expenses
        'Meals & Entertainment': ['6.6.5.19', '7000'], // NDFSP: Reception, Basic: Operating Expenses
        'Technology & Equipment': ['6.6.5.9', '7000'], // NDFSP: Maintenance, Basic: Operating Expenses
        'Marketing & Advertising': ['6.6.5.21', '7000'], // NDFSP: Advertising, Basic: Operating Expenses
        'Professional Services': ['6.6.5.6', '7000'], // NDFSP: Consultancy, Basic: Operating Expenses
        'Utilities & Rent': ['6.6.3.1', '7000'], // NDFSP: Office rent, Basic: Operating Expenses
        'Insurance': ['6.6.5.20', '7000'], // NDFSP: Insurance, Basic: Operating Expenses
        'Training & Development': ['6.6.1.9', '7000'], // NDFSP: Training, Basic: Operating Expenses
        'Maintenance & Repairs': ['6.6.3.2', '7000'], // NDFSP: Maintenance, Basic: Operating Expenses
        'Other': ['6.6.5.25', '7000'] // NDFSP: Other expenses, Basic: Operating Expenses
      };

      const accountCodes = expenseAccountMapping[expense.category] || ['6.6.5.25', '7000'];
      let expenseAccount = null;
      
      // Try NDFSP format first
      for (const code of accountCodes) {
        expenseAccount = await ChartOfAccounts.findOne({ accountCode: code });
        if (expenseAccount) break;
      }

      if (!cashAccount || !expenseAccount) {
        throw new Error('Required Chart of Accounts not found for expense');
      }

      // Ensure amounts are numbers and properly rounded
      const expenseAmount = Number(expense.amount || 0);

      // Create entries array
      const entries = [
        {
          account: expenseAccount._id,
          debit: expenseAmount,
          credit: 0,
          balance: expenseAmount
        },
        {
          account: cashAccount._id,
          debit: 0,
          credit: expenseAmount,
          balance: -expenseAmount
        }
      ];

      // Calculate totals with proper rounding
      const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
      const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);

      // Validate debits equal credits (with small tolerance for rounding)
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Debits (${totalDebit}) and credits (${totalCredit}) must be equal`);
      }

      const transaction = new GeneralLedger({
        transactionDate: expense.expenseDate || new Date(),
        reference: `EXP-${expense._id}`,
        referenceType: 'expense',
        referenceId: expense._id,
        description: `Expense - ${expense.title} (${expense.category})`,
        entries: entries,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: expense.branch,
        createdBy: validUserId,
        status: 'posted'
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(expenseAccount._id, expense.amount, 'debit');
      await this.updateAccountBalance(cashAccount._id, expense.amount, 'credit');

      console.log(`✅ Expense recorded: ${expense.amount} RWF to account ${expenseAccount.accountCode}`);
      return transaction;

    } catch (error) {
      console.error('Error recording expense:', error);
      throw error;
    }
  }

  // ==================== LOAN CLASSIFICATION INTEGRATION ====================
  
  /**
   * Record loan classification changes and provisions
   */
  static async recordLoanClassification(loan, oldClassification, newClassification, userId) {
    try {
      console.log(`💰 Recording loan classification: ${loan.loanCode} - ${oldClassification} to ${newClassification}`);
      
      // Get provision accounts based on classification
      const provisionAccountMapping = {
        'watch': '2.9.9.2.1', // Provisions on Watch loans
        'substandard': '2.9.9.3.1', // Provisions on Substandard loans
        'doubtful': '2.9.9.4.1', // Provisions on Doubtful loans
        'loss': '2.9.9.5.1' // Provisions on Loss loans
      };

      const provisionExpenseMapping = {
        'watch': '6.7.1.2', // Provisions for Watch loans
        'substandard': '6.7.1.3', // Provisions for Substandard loans
        'doubtful': '6.7.1.4', // Provisions for doubtful loans
        'loss': '6.7.1.5' // Provisions for Loss loans
      };

      if (newClassification !== 'normal' && newClassification !== oldClassification) {
        const provisionAccountCode = provisionAccountMapping[newClassification];
        const provisionExpenseCode = provisionExpenseMapping[newClassification];

        if (provisionAccountCode && provisionExpenseCode) {
          const provisionAccount = await ChartOfAccounts.findOne({ accountCode: provisionAccountCode });
          const provisionExpenseAccount = await ChartOfAccounts.findOne({ accountCode: provisionExpenseCode });

          if (provisionAccount && provisionExpenseAccount) {
            const provisionAmount = loan.outstandingBalance * (loan.classification?.provisionRate || 0.1);

            const transaction = new GeneralLedger({
              transactionDate: new Date(),
              reference: `PROV-${loan.loanCode}`,
              referenceType: 'provision',
              referenceId: loan._id,
              description: `Loan provision - ${loan.loanCode} (${newClassification})`,
              entries: [
                {
                  account: provisionExpenseAccount._id,
                  debit: provisionAmount,
                  credit: 0
                },
                {
                  account: provisionAccount._id,
                  debit: 0,
                  credit: provisionAmount
                }
              ],
              totalDebit: provisionAmount,
              totalCredit: provisionAmount,
              fiscalYear: new Date().getFullYear(),
              fiscalPeriod: new Date().getMonth() + 1,
              branch: loan.branch,
              createdBy: userId
            });

            await transaction.save();

            // Update account balances
            await this.updateAccountBalance(provisionExpenseAccount._id, provisionAmount, 'debit');
            await this.updateAccountBalance(provisionAccount._id, provisionAmount, 'credit');

            console.log(`✅ Loan provision recorded: ${provisionAmount} RWF for ${newClassification} classification`);
            return transaction;
          }
        }
      }

    } catch (error) {
      console.error('Error recording loan classification:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================
  
  /**
   * Get loan account based on loan type/product
   */
  static async getLoanAccountByType(loan) {
    const loanTypeMapping = {
      'Overdraft and Treasury Loans': '2.1.1.1',
      'Equipment Loans': '2.1.1.2',
      'Consumer Loans': '2.1.1.3',
      'Mortgage Loans': '2.1.1.4',
      'Others Loans': '2.1.1.5'
    };

    // Try to get from loan product first
    if (loan.product) {
      try {
        const LoanProduct = (await import('../models/loanProductModel.js')).default;
        const loanProduct = await LoanProduct.findById(loan.product);
        if (loanProduct) {
          const accountCode = loanTypeMapping[loanProduct.category] || '2.1.1.5';
          return await ChartOfAccounts.findOne({ accountCode });
        }
      } catch (error) {
        console.error('Error getting loan product:', error);
      }
    }

    // Fallback to loan type
    const accountCode = loanTypeMapping[loan.loanType] || '2.1.1.5';
    return await ChartOfAccounts.findOne({ accountCode });
  }

  /**
   * Update account balance
   */
  static async updateAccountBalance(accountId, amount, type) {
    try {
      const account = await ChartOfAccounts.findById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      if (type === 'debit') {
        if (account.accountType === 'asset' || account.accountType === 'expense') {
          account.currentBalance += amount;
        } else {
          account.currentBalance -= amount;
        }
      } else if (type === 'credit') {
        if (account.accountType === 'liability' || account.accountType === 'equity' || account.accountType === 'revenue') {
          account.currentBalance += amount;
        } else {
          account.currentBalance -= amount;
        }
      }

      await account.save();
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }

  /**
   * Get financial summary for dashboard
   */
  static async getFinancialSummary(branch = null) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Get key account balances
      const keyAccounts = await ChartOfAccounts.find({
        accountCode: {
          $in: [
            '1.0.1.1', // Cash in Vaults
            '2.1.1.1', // Overdraft and Treasury Loans
            '2.1.1.2', // Equipment Loans
            '2.1.1.3', // Consumer Loans
            '2.1.1.4', // Mortgage Loans
            '2.1.1.5', // Others Loans
            '7.1.1.1', // Interest Income
            '6.6.1.1'  // Net salary
          ]
        },
        branch: branch || { $exists: true }
      });

      const summary = {
        totalCash: 0,
        totalLoans: 0,
        totalInterestIncome: 0,
        totalFeeIncome: 0,
        totalSalaryExpense: 0,
        accountBreakdown: {}
      };

      keyAccounts.forEach(account => {
        const balance = account.currentBalance || 0;
        
        if (account.accountCode === '1.0.1.1') {
          summary.totalCash = balance;
        } else if (account.accountCode.startsWith('2.1.1.')) {
          summary.totalLoans += balance;
        } else if (account.accountCode === '7.1.1.1') {
          summary.totalInterestIncome = balance;
        } else if (account.accountCode === '6.6.1.1') {
          summary.totalSalaryExpense = balance;
        }

        summary.accountBreakdown[account.accountCode] = {
          name: account.accountName,
          balance: balance
        };
      });

      // Calculate total fee income from active loans (disabled for savings management system)
      try {
        // const Loan = (await import('../models/loanModel.js')).default; // Removed for savings management system
        // const activeLoans = await Loan.find({
        //   status: { $in: ['disbursed', 'overdue', 'completed'] }
        // }).populate('product');

        // let totalFeeIncome = 0;
        // for (const loan of activeLoans) {
        //   if (loan.product) {
        //     const LoanProduct = (await import('../models/loanProductModel.js')).default;
        //     const product = await LoanProduct.findById(loan.product);
        //     if (product) {
        //       totalFeeIncome += product.calculateTotalFees(loan.disbursedAmount || loan.amount);
        //     }
        //   } else {
        //     // Use default fees if no product
        //     totalFeeIncome += (loan.disbursedAmount || loan.amount) * 0.03;
        //   }
        // }
        // summary.totalFeeIncome = totalFeeIncome;
        summary.totalFeeIncome = 0; // Set to 0 for savings management system
      } catch (error) {
        console.error('Error calculating fee income:', error);
      }

      return summary;
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }

  // ==================== LOAN COMPLETION INTEGRATION ====================
  
  /**
   * Record loan completion with profit and fees
   */
  static async recordLoanCompletion(loan, completionType, userId) {
    try {
      console.log(`💰 Recording loan completion: ${loan.loanCode} - Type: ${completionType}`);
      
      // Handle system user ID
      let validUserId = userId;
      if (userId === 'system' || !userId) {
        const mongoose = (await import('mongoose')).default;
        validUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      }

      // Get financial data from loan
      const principalAmount = loan.disbursedAmount || loan.amount || 0;
      const interestRate = loan.interestRate || 4.5;
      const durationMonths = loan.durationMonths || 12;
      const totalInterest = principalAmount * (interestRate / 100) * durationMonths;
      
      // Calculate fees if loan product exists
      let totalFees = 0;
      if (loan.product) {
        try {
          const LoanProduct = (await import('../models/loanProductModel.js')).default;
          const product = await LoanProduct.findById(loan.product);
          if (product) {
            totalFees = product.calculateTotalFees(principalAmount);
          }
        } catch (error) {
          console.error('Error calculating fees:', error);
          totalFees = principalAmount * 0.03; // 3% default
        }
      } else {
        totalFees = principalAmount * 0.03; // 3% default
      }

      // Get required accounts with fallback logic
      // Cash account (for receiving payments)
      let cashAccount = await ChartOfAccounts.findOne({ accountCode: '1.0.1.1' });
      if (!cashAccount) {
        cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' }); // Cash and Cash Equivalents
      }

      // Loans receivable account (to reduce the loan balance)
      let loansReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '2.1.1.5' }); // Others Loans
      if (!loansReceivableAccount) {
        loansReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '1200' }); // Accounts Receivable
      }

      // Interest income account
      let interestIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '7.1.1.1' }); // Interest on loans
      if (!interestIncomeAccount) {
        interestIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6000' }); // Operating Revenue
      }

      // Fee income account
      let feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '7.4.6.1' }); // Loan application fees
      if (!feeIncomeAccount) {
        feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6000' }); // Operating Revenue
      }

      if (!cashAccount || !loansReceivableAccount) {
        throw new Error('Required Chart of Accounts not found for loan completion');
      }

      const totalAmountReceived = principalAmount + totalInterest + totalFees;

      // Create comprehensive completion transaction
      const entries = [
        {
          account: cashAccount._id,
          debit: totalAmountReceived,
          credit: 0,
          balance: totalAmountReceived
        },
        {
          account: loansReceivableAccount._id,
          debit: 0,
          credit: principalAmount,
          balance: -principalAmount
        }
      ];

      // Add income entries (combine if using same account)
      const totalIncome = totalInterest + totalFees;
      if (totalIncome > 0) {
        // If both use the same account, combine them
        if (interestIncomeAccount && feeIncomeAccount && 
            interestIncomeAccount._id.toString() === feeIncomeAccount._id.toString()) {
          entries.push({
            account: interestIncomeAccount._id,
            debit: 0,
            credit: totalIncome,
            balance: totalIncome
          });
          console.log(`💰 Combined income entry: Interest ${totalInterest.toLocaleString()} + Fees ${totalFees.toLocaleString()} = ${totalIncome.toLocaleString()} RWF`);
        } else {
          // Add separate entries if different accounts
          if (totalInterest > 0 && interestIncomeAccount) {
            entries.push({
              account: interestIncomeAccount._id,
              debit: 0,
              credit: totalInterest,
              balance: totalInterest
            });
            console.log(`💰 Interest income entry: ${totalInterest.toLocaleString()} RWF`);
          }
          
          if (totalFees > 0 && feeIncomeAccount) {
            entries.push({
              account: feeIncomeAccount._id,
              debit: 0,
              credit: totalFees,
              balance: totalFees
            });
            console.log(`💰 Fee income entry: ${totalFees.toLocaleString()} RWF`);
          }
        }
      }

      const transaction = new GeneralLedger({
        transactionDate: new Date(),
        reference: `LOAN-COMP-${loan.loanCode}`,
        referenceType: 'payment',
        referenceId: loan._id,
        description: `Loan completion - ${loan.loanCode} - Principal: ${principalAmount.toLocaleString()} RWF, Interest: ${totalInterest.toLocaleString()} RWF, Fees: ${totalFees.toLocaleString()} RWF`,
        entries,
        totalDebit: totalAmountReceived,
        totalCredit: totalAmountReceived,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: validUserId
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(cashAccount._id, totalAmountReceived, 'debit');
      await this.updateAccountBalance(loansReceivableAccount._id, principalAmount, 'credit');
      
      // Update income account balances (combine if using same account)
      if (totalIncome > 0) {
        if (interestIncomeAccount && feeIncomeAccount && 
            interestIncomeAccount._id.toString() === feeIncomeAccount._id.toString()) {
          // Combined income account
          await this.updateAccountBalance(interestIncomeAccount._id, totalIncome, 'credit');
        } else {
          // Separate income accounts
          if (totalInterest > 0 && interestIncomeAccount) {
            await this.updateAccountBalance(interestIncomeAccount._id, totalInterest, 'credit');
          }
          
          if (totalFees > 0 && feeIncomeAccount) {
            await this.updateAccountBalance(feeIncomeAccount._id, totalFees, 'credit');
          }
        }
      }

      console.log(`✅ Loan completion recorded: ${loan.loanCode}`);
      console.log(`   Principal: ${principalAmount.toLocaleString()} RWF`);
      console.log(`   Interest: ${totalInterest.toLocaleString()} RWF`);
      console.log(`   Fees: ${totalFees.toLocaleString()} RWF`);
      console.log(`   Total: ${totalAmountReceived.toLocaleString()} RWF`);
      
      return transaction;

    } catch (error) {
      console.error('❌ Error recording loan completion:', error);
      throw error;
    }
  }
}

export default EnhancedFinancialIntegrationService;

