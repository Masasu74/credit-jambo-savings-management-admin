import FinancialIntegrationService from './financialIntegrationService.js';
import GeneralLedger from '../models/generalLedgerModel.js';
import ChartOfAccounts from '../models/chartOfAccountsModel.js';
import { TrialBalance, ProfitLoss, BalanceSheet, CashFlow } from '../models/financialStatementsModel.js';
import { logActivity } from '../utils/logActivity.js';

class FinancialManagementService {
  /**
   * Process loan disbursement and create financial entries
   */
  static async processLoanDisbursement(loan, userId) {
    try {
      console.log(`🔄 Processing loan disbursement: ${loan.loanCode}`);
      
      // Record the disbursement in general ledger
      const transaction = await FinancialIntegrationService.recordLoanDisbursement(loan, userId);
      
      // Update loan status if needed
      if (loan.status === 'approved') {
        loan.status = 'disbursed';
        loan.disbursementDate = new Date();
        await loan.save();
      }
      
      console.log(`✅ Loan disbursement processed successfully: ${loan.loanCode}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing loan disbursement: ${loan.loanCode}`, error);
      throw error;
    }
  }

  /**
   * Process loan payment and create financial entries
   */
  static async processLoanPayment(loan, paymentAmount, paymentDate, userId, paymentType = 'mixed') {
    try {
      console.log(`🔄 Processing loan payment: ${loan.loanCode} - ${paymentAmount} RWF`);
      
      // Record the payment in general ledger
      const transaction = await FinancialIntegrationService.recordLoanPayment(loan, paymentAmount, paymentDate, userId);
      
      // Update loan outstanding balance
      if (loan.outstandingBalance) {
        loan.outstandingBalance = Math.max(0, loan.outstandingBalance - paymentAmount);
        await loan.save();
      }
      
      console.log(`✅ Loan payment processed successfully: ${loan.loanCode}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing loan payment: ${loan.loanCode}`, error);
      throw error;
    }
  }

  /**
   * Process loan completion and create financial entries
   */
  static async processLoanCompletion(loan, userId) {
    try {
      console.log(`🔄 Processing loan completion: ${loan.loanCode}`);
      
      // Record the completion in general ledger
      const transaction = await FinancialIntegrationService.recordLoanCompletion(loan, 'completed', userId);
      
      // Update loan status
      loan.status = 'completed';
      loan.completionDate = new Date();
      await loan.save();
      
      console.log(`✅ Loan completion processed successfully: ${loan.loanCode}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing loan completion: ${loan.loanCode}`, error);
      throw error;
    }
  }

  /**
   * Process expense approval and create financial entries
   */
  static async processExpenseApproval(expense, userId) {
    try {
      console.log(`🔄 Processing expense approval: ${expense.title}`);
      
      // Record the expense in general ledger
      const transaction = await FinancialIntegrationService.recordExpense(expense, userId);
      
      // Update expense status
      expense.status = 'approved';
      expense.approvedBy = userId;
      expense.approvedAt = new Date();
      await expense.save();
      
      console.log(`✅ Expense approval processed successfully: ${expense.title}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing expense approval: ${expense.title}`, error);
      throw error;
    }
  }

  /**
   * Process salary payment and create financial entries
   */
  static async processSalaryPayment(salary, userId) {
    try {
      console.log(`🔄 Processing salary payment: ${salary.employee?.personalInfo?.fullName || 'Employee'}`);
      
      // Record the salary payment in general ledger
      const transaction = await FinancialIntegrationService.recordSalaryPayment(salary, userId);
      
      // Update salary status
      salary.status = 'paid';
      salary.paymentDate = new Date();
      await salary.save();
      
      console.log(`✅ Salary payment processed successfully: ${salary.employee?.personalInfo?.fullName || 'Employee'}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing salary payment: ${salary.employee?.personalInfo?.fullName || 'Employee'}`, error);
      throw error;
    }
  }

  /**
   * Process capital injection and create financial entries
   */
  static async processCapitalInjection(amount, source, description, userId, branch) {
    try {
      console.log(`🔄 Processing capital injection: ${amount} RWF from ${source}`);
      
      // Record the capital injection in general ledger
      const transaction = await FinancialIntegrationService.recordCapitalInjection(amount, source, description, userId, branch);
      
      console.log(`✅ Capital injection processed successfully: ${amount} RWF from ${source}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing capital injection: ${amount} RWF from ${source}`, error);
      throw error;
    }
  }

  /**
   * Process loan write-off and create financial entries
   */
  static async processLoanWriteOff(loan, writeOffAmount, reason, userId) {
    try {
      console.log(`🔄 Processing loan write-off: ${loan.loanCode} - ${writeOffAmount} RWF`);
      
      // Record the write-off in general ledger
      const transaction = await FinancialIntegrationService.recordLoanWriteOff(loan, writeOffAmount, reason, userId);
      
      // Update loan status
      loan.status = 'write_off';
      loan.writeOffDate = new Date();
      loan.writeOffReason = reason;
      loan.writeOffAmount = writeOffAmount;
      await loan.save();
      
      console.log(`✅ Loan write-off processed successfully: ${loan.loanCode}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Error processing loan write-off: ${loan.loanCode}`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive financial statements
   */
  static async generateFinancialStatements(fiscalYear, fiscalPeriod, branch = null) {
    try {
      console.log(`🔄 Generating financial statements for ${fiscalYear}-${fiscalPeriod}`);
      
      const startDate = new Date(fiscalYear, fiscalPeriod - 1, 1);
      const endDate = new Date(fiscalYear, fiscalPeriod, 0);
      
      // Generate Trial Balance
      const trialBalance = await this.generateTrialBalance(fiscalYear, fiscalPeriod, branch);
      
      // Generate Profit & Loss
      const profitLoss = await this.generateProfitLoss(fiscalYear, fiscalPeriod, branch);
      
      // Generate Balance Sheet
      const balanceSheet = await this.generateBalanceSheet(fiscalYear, fiscalPeriod, branch);
      
      // Generate Cash Flow
      const cashFlow = await this.generateCashFlow(fiscalYear, fiscalPeriod, branch);
      
      console.log(`✅ Financial statements generated successfully for ${fiscalYear}-${fiscalPeriod}`);
      
      return {
        trialBalance,
        profitLoss,
        balanceSheet,
        cashFlow
      };
    } catch (error) {
      console.error(`❌ Error generating financial statements for ${fiscalYear}-${fiscalPeriod}`, error);
      throw error;
    }
  }

  /**
   * Generate Trial Balance
   */
  static async generateTrialBalance(fiscalYear, fiscalPeriod, branch = null) {
    try {
      const trialBalance = await GeneralLedger.getTrialBalance(new Date(fiscalYear, fiscalPeriod, 0));
      
      const trialBalanceDoc = new TrialBalance({
        fiscalYear,
        fiscalPeriod,
        asOfDate: new Date(fiscalYear, fiscalPeriod, 0),
        accounts: trialBalance.map(account => ({
          account: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          openingBalance: 0, // This would need to be calculated from previous periods
          totalDebit: account.totalDebit,
          totalCredit: account.totalCredit,
          closingBalance: account.balance
        })),
        totalDebit: trialBalance.reduce((sum, account) => sum + account.totalDebit, 0),
        totalCredit: trialBalance.reduce((sum, account) => sum + account.totalCredit, 0),
        isBalanced: Math.abs(
          trialBalance.reduce((sum, account) => sum + account.totalDebit, 0) -
          trialBalance.reduce((sum, account) => sum + account.totalCredit, 0)
        ) < 0.01,
        branch,
        generatedBy: 'system'
      });
      
      await trialBalanceDoc.save();
      return trialBalanceDoc;
    } catch (error) {
      console.error('Error generating trial balance:', error);
      throw error;
    }
  }

  /**
   * Generate Profit & Loss Statement
   */
  static async generateProfitLoss(fiscalYear, fiscalPeriod, branch = null) {
    try {
      const startDate = new Date(fiscalYear, fiscalPeriod - 1, 1);
      const endDate = new Date(fiscalYear, fiscalPeriod, 0);
      
      // Get revenue accounts
      const revenueAccounts = await ChartOfAccounts.find({
        accountType: 'revenue',
        isActive: true,
        branch: branch || { $exists: false }
      });
      
      // Get expense accounts
      const expenseAccounts = await ChartOfAccounts.find({
        accountType: 'expense',
        isActive: true,
        branch: branch || { $exists: false }
      });
      
      // Calculate totals
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      for (const account of revenueAccounts) {
        const balance = await GeneralLedger.getAccountBalance(account._id, endDate);
        totalRevenue += Math.abs(balance);
      }
      
      for (const account of expenseAccounts) {
        const balance = await GeneralLedger.getAccountBalance(account._id, endDate);
        totalExpenses += Math.abs(balance);
      }
      
      const netIncome = totalRevenue - totalExpenses;
      
      const profitLossDoc = new ProfitLoss({
        fiscalYear,
        fiscalPeriod,
        periodType: 'monthly',
        startDate,
        endDate,
        revenue: {
          totalRevenue,
          categories: revenueAccounts.map(account => ({
            category: account.accountName,
            amount: 0, // Simplified for now
            percentage: 0
          }))
        },
        costOfGoodsSold: {
          totalCOGS: 0, // NDFIs typically don't have COGS
          categories: []
        },
        grossProfit: totalRevenue,
        grossProfitMargin: totalRevenue > 0 ? 100 : 0,
        operatingExpenses: {
          totalExpenses,
          categories: expenseAccounts.map(account => ({
            category: account.accountName,
            amount: 0, // Simplified for now
            percentage: 0
          }))
        },
        operatingIncome: netIncome,
        operatingMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        nonOperatingIncome: 0,
        nonOperatingExpenses: 0,
        netIncome,
        netProfitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        incomeTax: 0, // This would need to be calculated based on tax rules
        netIncomeAfterTax: netIncome,
        branch,
        generatedBy: 'system'
      });
      
      await profitLossDoc.save();
      return profitLossDoc;
    } catch (error) {
      console.error('Error generating profit & loss statement:', error);
      throw error;
    }
  }

  /**
   * Generate Balance Sheet
   */
  static async generateBalanceSheet(fiscalYear, fiscalPeriod, branch = null) {
    try {
      const asOfDate = new Date(fiscalYear, fiscalPeriod, 0);
      
      // Get asset accounts
      const assetAccounts = await ChartOfAccounts.find({
        accountType: 'asset',
        isActive: true,
        branch: branch || { $exists: false }
      });
      
      // Get liability accounts
      const liabilityAccounts = await ChartOfAccounts.find({
        accountType: 'liability',
        isActive: true,
        branch: branch || { $exists: false }
      });
      
      // Get equity accounts
      const equityAccounts = await ChartOfAccounts.find({
        accountType: 'equity',
        isActive: true,
        branch: branch || { $exists: false }
      });
      
      // Calculate totals
      let currentAssetsTotal = 0;
      let fixedAssetsTotal = 0;
      let currentLiabilitiesTotal = 0;
      let longTermLiabilitiesTotal = 0;
      let shareCapitalTotal = 0;
      let retainedEarningsTotal = 0;
      
      for (const account of assetAccounts) {
        const balance = await GeneralLedger.getAccountBalance(account._id, asOfDate);
        if (account.accountCategory === 'current_assets') {
          currentAssetsTotal += Math.abs(balance);
        } else if (account.accountCategory === 'fixed_assets') {
          fixedAssetsTotal += Math.abs(balance);
        }
      }
      
      for (const account of liabilityAccounts) {
        const balance = await GeneralLedger.getAccountBalance(account._id, asOfDate);
        if (account.accountCategory === 'current_liabilities') {
          currentLiabilitiesTotal += Math.abs(balance);
        } else if (account.accountCategory === 'long_term_liabilities') {
          longTermLiabilitiesTotal += Math.abs(balance);
        }
      }
      
      for (const account of equityAccounts) {
        const balance = await GeneralLedger.getAccountBalance(account._id, asOfDate);
        if (account.accountCategory === 'shareholders_equity') {
          shareCapitalTotal += Math.abs(balance);
        } else if (account.accountCategory === 'retained_earnings') {
          retainedEarningsTotal += Math.abs(balance);
        }
      }
      
      const totalAssets = currentAssetsTotal + fixedAssetsTotal;
      const totalLiabilities = currentLiabilitiesTotal + longTermLiabilitiesTotal;
      const totalEquity = shareCapitalTotal + retainedEarningsTotal;
      
      const balanceSheetDoc = new BalanceSheet({
        fiscalYear,
        fiscalPeriod,
        asOfDate,
        assets: {
          currentAssets: {
            total: currentAssetsTotal,
            categories: assetAccounts
              .filter(account => account.accountCategory === 'current_assets')
              .map(account => ({
                category: account.accountName,
                amount: 0, // Simplified for now
                percentage: 0
              }))
          },
          fixedAssets: {
            total: fixedAssetsTotal,
            categories: assetAccounts
              .filter(account => account.accountCategory === 'fixed_assets')
              .map(account => ({
                category: account.accountName,
                amount: 0, // Simplified for now
                percentage: 0
              }))
          },
          totalAssets
        },
        liabilities: {
          currentLiabilities: {
            total: currentLiabilitiesTotal,
            categories: liabilityAccounts
              .filter(account => account.accountCategory === 'current_liabilities')
              .map(account => ({
                category: account.accountName,
                amount: 0, // Simplified for now
                percentage: 0
              }))
          },
          longTermLiabilities: {
            total: longTermLiabilitiesTotal,
            categories: liabilityAccounts
              .filter(account => account.accountCategory === 'long_term_liabilities')
              .map(account => ({
                category: account.accountName,
                amount: 0, // Simplified for now
                percentage: 0
              }))
          },
          totalLiabilities
        },
        equity: {
          shareCapital: shareCapitalTotal,
          retainedEarnings: retainedEarningsTotal,
          currentPeriodEarnings: 0, // This would need to be calculated from P&L
          totalEquity
        },
        ratios: {
          currentRatio: currentLiabilitiesTotal > 0 ? currentAssetsTotal / currentLiabilitiesTotal : 0,
          debtToEquityRatio: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
          returnOnAssets: totalAssets > 0 ? 0 : 0, // This would need to be calculated from P&L
          returnOnEquity: totalEquity > 0 ? 0 : 0 // This would need to be calculated from P&L
        },
        branch,
        generatedBy: 'system'
      });
      
      await balanceSheetDoc.save();
      return balanceSheetDoc;
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw error;
    }
  }

  /**
   * Generate Cash Flow Statement
   */
  static async generateCashFlow(fiscalYear, fiscalPeriod, branch = null) {
    try {
      const startDate = new Date(fiscalYear, fiscalPeriod - 1, 1);
      const endDate = new Date(fiscalYear, fiscalPeriod, 0);
      
      // Get cash account balance at start and end
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1110' });
      const beginningCashBalance = cashAccount ? await GeneralLedger.getAccountBalance(cashAccount._id, startDate) : 0;
      const endingCashBalance = cashAccount ? await GeneralLedger.getAccountBalance(cashAccount._id, endDate) : 0;
      
      // Get transactions for the period
      const transactions = await GeneralLedger.getPeriodTransactions(fiscalYear, fiscalPeriod, 'posted');
      
      // Calculate cash flows
      let netCashFromOperations = 0;
      let netCashFromInvesting = 0;
      let netCashFromFinancing = 0;
      
      for (const transaction of transactions) {
        if (transaction.referenceType === 'loan' || transaction.referenceType === 'expense' || transaction.referenceType === 'salary') {
          netCashFromOperations += transaction.netAmount || 0;
        } else if (transaction.referenceType === 'adjustment') {
          netCashFromFinancing += transaction.netAmount || 0;
        }
      }
      
      const netChangeInCash = netCashFromOperations + netCashFromInvesting + netCashFromFinancing;
      
      const cashFlowDoc = new CashFlow({
        fiscalYear,
        fiscalPeriod,
        startDate,
        endDate,
        operatingActivities: {
          netIncome: 0, // This would need to be calculated from P&L
          adjustments: [],
          changesInWorkingCapital: [],
          netCashFromOperations
        },
        investingActivities: {
          capitalExpenditures: 0,
          acquisitions: 0,
          investments: 0,
          netCashFromInvesting
        },
        financingActivities: {
          debtIssuance: 0,
          debtRepayment: 0,
          equityIssuance: 0,
          dividends: 0,
          netCashFromFinancing
        },
        netChangeInCash,
        beginningCashBalance,
        endingCashBalance,
        branch,
        generatedBy: 'system'
      });
      
      await cashFlowDoc.save();
      return cashFlowDoc;
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      throw error;
    }
  }

  /**
   * Get financial KPIs and ratios
   */
  static async getFinancialKPIs(branch = null) {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Get current period data
      const trialBalance = await this.generateTrialBalance(currentYear, currentMonth, branch);
      const profitLoss = await this.generateProfitLoss(currentYear, currentMonth, branch);
      const balanceSheet = await this.generateBalanceSheet(currentYear, currentMonth, branch);
      
      // Calculate KPIs
      const kpis = {
        // Liquidity Ratios
        currentRatio: balanceSheet.ratios.currentRatio,
        quickRatio: balanceSheet.ratios.currentRatio, // Simplified for NDFIs
        
        // Profitability Ratios
        netProfitMargin: profitLoss.netProfitMargin,
        returnOnAssets: balanceSheet.ratios.returnOnAssets,
        returnOnEquity: balanceSheet.ratios.returnOnEquity,
        
        // Efficiency Ratios
        assetTurnover: profitLoss.revenue.totalRevenue / balanceSheet.assets.totalAssets,
        
        // Financial Position
        totalAssets: balanceSheet.assets.totalAssets,
        totalLiabilities: balanceSheet.liabilities.totalLiabilities,
        totalEquity: balanceSheet.equity.totalEquity,
        netIncome: profitLoss.netIncome,
        
        // Cash Flow
        operatingCashFlow: profitLoss.netIncome, // Simplified
        freeCashFlow: profitLoss.netIncome, // Simplified
        
        // Growth Metrics
        revenueGrowth: 0, // This would need historical data
        assetGrowth: 0, // This would need historical data
        
        // Risk Metrics
        debtToEquityRatio: balanceSheet.ratios.debtToEquityRatio,
        loanLossRatio: 0, // This would need loan portfolio data
        capitalAdequacyRatio: balanceSheet.equity.totalEquity / balanceSheet.assets.totalAssets
      };
      
      return kpis;
    } catch (error) {
      console.error('Error getting financial KPIs:', error);
      throw error;
    }
  }
}

export default FinancialManagementService;
