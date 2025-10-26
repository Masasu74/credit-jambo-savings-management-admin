import NDFISReporting from '../models/ndfisReportingModel.js';
// import Loan from '../models/loanModel.js';
import Customer from '../models/customerModel.js';
import ChartOfAccounts from '../models/chartOfAccountsModel.js';
import Branch from '../models/branchModel.js';
import User from '../models/userModel.js';

class NDFISReportingService {
  
  /**
   * Generate comprehensive NDFIS report
   */
  static async generateNDFISReport(fiscalYear, fiscalPeriod, branch = null, userId) {
    try {
      console.log(`🔄 Generating NDFIS report for ${fiscalYear}-${fiscalPeriod}`);
      
      const startDate = new Date(fiscalYear, fiscalPeriod - 1, 1);
      const endDate = new Date(fiscalYear, fiscalPeriod, 0);
      
      // Check if report already exists
      const existingReport = await NDFISReporting.findOne({
        fiscalYear,
        fiscalPeriod,
        branch: branch || null
      });
      
      if (existingReport) {
        console.log('📋 Report already exists, updating...');
        return await this.updateExistingReport(existingReport, startDate, endDate, branch);
      }
      
      // Generate new report
      const reportData = await this.calculateReportData(startDate, endDate, branch);
      
      const newReport = new NDFISReporting({
        reportType: 'quarterly',
        fiscalYear,
        fiscalPeriod,
        reportDate: endDate,
        branch: branch || null,
        ...reportData,
        createdBy: userId
      });
      
      await newReport.save();
      
      console.log(`✅ NDFIS report generated successfully for ${fiscalYear}-${fiscalPeriod}`);
      return newReport;
      
    } catch (error) {
      console.error(`❌ Error generating NDFIS report:`, error);
      throw error;
    }
  }

  /**
   * Generate multi-period NDFIS report (matching Excel template format)
   */
  static async generateMultiPeriodNDFISReport(fiscalYear, branch = null, userId) {
    try {
      console.log(`🔄 Generating multi-period NDFIS report for ${fiscalYear}`);
      
      // Define the 6 periods as shown in the template
      const periods = [
        { period: 'Sep-24', date: new Date(2024, 8, 30) },
        { period: 'Dec-24', date: new Date(2024, 11, 31) },
        { period: 'Mar-25', date: new Date(2025, 2, 31) },
        { period: 'Jun-25', date: new Date(2025, 5, 30) },
        { period: 'Sep-25', date: new Date(2025, 8, 30) },
        { period: 'Dec-25', date: new Date(2025, 11, 31) }
      ];
      
      // Check if multi-period report already exists
      const existingReport = await NDFISReporting.findOne({
        reportType: 'multi-period',
        fiscalYear,
        branch: branch || null
      });
      
      if (existingReport) {
        console.log('📋 Multi-period report already exists, updating...');
        return await this.updateMultiPeriodReport(existingReport, periods, branch);
      }
      
      // Calculate data for each period
      const periodsData = [];
      for (const periodInfo of periods) {
        const periodData = await this.calculateReportData(
          new Date(periodInfo.date.getFullYear(), periodInfo.date.getMonth(), 1),
          periodInfo.date,
          branch
        );
        periodsData.push({
          period: periodInfo.period,
          date: periodInfo.date,
          data: periodData
        });
      }
      
      const newReport = new NDFISReporting({
        reportType: 'multi-period',
        fiscalYear,
        fiscalPeriod: 12, // Full year
        reportDate: new Date(),
        branch: branch || null,
        periods: periodsData,
        createdBy: userId
      });
      
      await newReport.save();
      
      console.log(`✅ Multi-period NDFIS report generated successfully for ${fiscalYear}`);
      return newReport;
      
    } catch (error) {
      console.error(`❌ Error generating multi-period NDFIS report:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate all report data from system
   */
  static async calculateReportData(startDate, endDate, branch = null) {
    try {
      // Build query filters
      const loanQuery = {
        status: { $in: ['disbursed', 'overdue', 'completed'] },
        disbursementDate: { $lte: endDate }
      };
      
      if (branch) {
        loanQuery.branch = branch;
      }
      
      // Get all loans for the period
      const loans = await Loan.find(loanQuery)
        .populate('customer', 'personalInfo.gender personalInfo.fullName')
        .populate('branch', 'name code');
      
      // Get customers for demographic analysis
      const customerQuery = branch ? { branch } : {};
      const customers = await Customer.find(customerQuery)
        .populate('branch', 'name code');
      
      // Get chart of accounts data
      const accounts = await ChartOfAccounts.find({ isActive: true });
      
      // Get branch and staff data
      const branches = await Branch.find();
      const staff = await User.find({ 
        role: { $in: ['admin', 'finance-manager', 'loan-officer', 'accountant'] },
        isActive: true 
      });
      
      // Calculate Balance Sheet data
      const balanceSheet = await this.calculateBalanceSheet(loans, accounts, endDate);
      
      // Calculate Income Statement data
      const incomeStatement = await this.calculateIncomeStatement(loans, accounts, startDate, endDate);
      
      // Calculate Supplementary Information
      const supplementaryInfo = await this.calculateSupplementaryInfo(loans, customers, branches, staff, startDate, endDate);
      
      return {
        balanceSheet,
        incomeStatement,
        supplementaryInfo,
        offBalanceSheet: {
          writtenOffLoans: await this.calculateWrittenOffLoans(startDate, endDate, branch)
        }
      };
      
    } catch (error) {
      console.error('Error calculating report data:', error);
      throw error;
    }
  }
  
  /**
   * Calculate Balance Sheet data
   */
  static async calculateBalanceSheet(loans, accounts, asOfDate) {
    try {
      // Calculate liquid assets from chart of accounts
      const liquidAssetsAccounts = accounts.filter(acc => 
        acc.accountCode.startsWith('1110') || // Cash on Hand
        acc.accountCode.startsWith('1120')    // Bank Accounts
      );
      
      const cashInVault = liquidAssetsAccounts
        .filter(acc => acc.accountCode === '1110')
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      const cashInBankCurrent = liquidAssetsAccounts
        .filter(acc => acc.accountCode === '1120')
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      const cashInBankTerm = 0; // Would need specific term deposit accounts
      
      // Calculate gross loans
      const grossLoans = loans
        .filter(loan => loan.status !== 'completed')
        .reduce((sum, loan) => sum + (loan.outstandingBalance || loan.disbursedAmount || 0), 0);
      
      // Calculate provisions
      const provisions = loans.reduce((sum, loan) => {
        if (loan.classification?.provisionAmount) {
          return sum + loan.classification.provisionAmount;
        }
        return sum;
      }, 0);
      
      // Calculate NPLs (Non-Performing Loans)
      const npls = loans
        .filter(loan => ['substandard', 'doubtful', 'loss'].includes(loan.classification?.status))
        .reduce((sum, loan) => sum + (loan.outstandingBalance || loan.disbursedAmount || 0), 0);
      
      // Calculate fixed assets
      const fixedAssetsAccounts = accounts.filter(acc => 
        acc.accountType === 'asset' && acc.accountCategory === 'fixed_assets'
      );
      
      const fixedAssetsNet = fixedAssetsAccounts.reduce((sum, acc) => {
        return sum + (acc.currentBalance || 0);
      }, 0);
      
      // Calculate interest receivable
      const interestReceivable = loans.reduce((sum, loan) => {
        return sum + (loan.calculateInterestEarned ? loan.calculateInterestEarned() : 0);
      }, 0);
      
      // Calculate total assets
      const totalLiquidAssets = cashInVault + cashInBankCurrent + cashInBankTerm;
      const netLoans = grossLoans - provisions;
      const totalAssets = totalLiquidAssets + netLoans + fixedAssetsNet + interestReceivable;
      
      // Calculate liabilities and equity
      const liabilityAccounts = accounts.filter(acc => acc.accountType === 'liability');
      const equityAccounts = accounts.filter(acc => acc.accountType === 'equity');
      
      const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      // Calculate ratios
      const nplRatio = grossLoans > 0 ? (npls / grossLoans) * 100 : 0;
      const capitalAdequacyRatio = totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0;
      const conversionOfResourcesIntoLoans = totalAssets > 0 ? (grossLoans / totalAssets) * 100 : 0;
      
      return {
        totalLiquidAssets,
        cashInVault,
        cashInBankCurrent,
        cashInBankTerm,
        grossLoans,
        provisions,
        netLoans,
        npls,
        financialInstruments: 0, // Would need specific accounts
        fixedAssetsNet,
        interestReceivable,
        otherAssets: 0, // Would need specific accounts
        suspenseAccounts: 0, // Would need specific accounts
        totalAssets,
        totalLiabilities,
        borrowings: 0, // Would need specific accounts
        cashCollateral: 0, // Would need specific accounts
        interestPayable: 0, // Would need specific accounts
        otherLiabilities: totalLiabilities,
        totalEquity,
        subsidies: 0, // Would need specific accounts
        revaluationSurplus: 0, // Would need specific accounts
        otherEquity: 0, // Would need specific accounts
        retainedProfits: 0, // Would need specific accounts
        profitLossPeriod: 0, // Will be calculated in income statement
        paidUpCapital: 0, // Would need specific accounts
        totalEquityLiabilities: totalLiabilities + totalEquity,
        ratios: {
          nplRatio,
          capitalAdequacyRatio,
          conversionOfResourcesIntoLoans,
          investmentInFixedAssets: totalAssets > 0 ? (fixedAssetsNet / totalAssets) * 100 : 0
        }
      };
      
    } catch (error) {
      console.error('Error calculating balance sheet:', error);
      throw error;
    }
  }
  
  /**
   * Calculate Income Statement data
   */
  static async calculateIncomeStatement(loans, accounts, startDate, endDate) {
    try {
      // Calculate interest income from loans
      const interestIncomeLoans = loans.reduce((sum, loan) => {
        if (loan.disbursementDate && new Date(loan.disbursementDate) <= endDate) {
          return sum + (loan.calculateInterestEarned ? loan.calculateInterestEarned() : 0);
        }
        return sum;
      }, 0);
      
      // Calculate fees and commissions
      const feesCommissionsLoans = loans.reduce((sum, loan) => {
        // This would need to be tracked in loan fees
        return sum + 0; // Placeholder
      }, 0);
      
      // Calculate other income from accounts
      const revenueAccounts = accounts.filter(acc => acc.accountType === 'revenue');
      const incomeOnDeposits = revenueAccounts
        .filter(acc => acc.accountCode.startsWith('6100'))
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      const otherFinancialIncome = revenueAccounts
        .filter(acc => acc.accountCode.startsWith('6200') || acc.accountCode.startsWith('6300'))
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      const totalFinancialIncome = interestIncomeLoans + feesCommissionsLoans + incomeOnDeposits + otherFinancialIncome;
      
      // Calculate expenses from accounts
      const expenseAccounts = accounts.filter(acc => acc.accountType === 'expense');
      const personnelExpenses = expenseAccounts
        .filter(acc => acc.accountCode.startsWith('7100'))
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      const administrativeExpenses = expenseAccounts
        .filter(acc => acc.accountCode.startsWith('7200'))
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      
      const totalExpenses = personnelExpenses + administrativeExpenses;
      
      // Calculate profit/loss
      const profitLossBeforeDonations = totalFinancialIncome - totalExpenses;
      const profitLossAfterTaxDonations = profitLossBeforeDonations; // Simplified
      
      // Calculate performance ratios
      const costToIncome = totalFinancialIncome > 0 ? (totalExpenses / totalFinancialIncome) * 100 : 0;
      const percentageOfFinancialIncome = 100; // All income is financial income
      
      return {
        totalFinancialIncome,
        interestIncomeLoans,
        feesCommissionsLoans,
        incomeOnDeposits,
        incomeFinancialInstruments: 0,
        otherFinancialIncome,
        recoveriesProvisionBack: 0,
        recoveriesWrittenOff: 0,
        otherOperatingIncome: 0,
        nonOperatingIncome: 0,
        totalIncomes: totalFinancialIncome,
        totalFinancialExpenses: 0,
        interestOnCashCollateral: 0,
        interestOnBorrowings: 0,
        bankChargesCommissions: 0,
        loanLossesProvisions: 0,
        loanLossesWrittenOff: 0,
        personnelExpenses,
        administrativeExpenses,
        nonOperatingExpenses: 0,
        totalExpenses,
        profitLossBeforeDonations,
        incomeTax: 0,
        profitAfterTaxBeforeDonations: profitLossBeforeDonations,
        donations: 0,
        profitLossAfterTaxDonations,
        dividends: 0,
        netProfitAfterDividends: profitLossAfterTaxDonations,
        performanceRatios: {
          costToIncome,
          percentageOfFinancialIncome,
          roa: 0, // Would need total assets
          roe: 0  // Would need total equity
        }
      };
      
    } catch (error) {
      console.error('Error calculating income statement:', error);
      throw error;
    }
  }
  
  /**
   * Calculate Supplementary Information
   */
  static async calculateSupplementaryInfo(loans, customers, branches, staff, startDate, endDate) {
    try {
      // Loans Outstanding by Gender
      const loansOutstanding = {
        men: 0,
        women: 0,
        groupEntities: 0,
        total: 0
      };
      
      const loansOutstandingValue = {
        men: 0,
        women: 0,
        groupEntities: 0,
        total: 0
      };
      
      // Analyze loans by gender
      loans.forEach(loan => {
        if (loan.customer?.personalInfo?.gender) {
          const gender = loan.customer.personalInfo.gender.toLowerCase();
          const outstandingAmount = loan.outstandingBalance || loan.disbursedAmount || 0;
          
          if (gender === 'male') {
            loansOutstanding.men++;
            loansOutstandingValue.men += outstandingAmount;
          } else if (gender === 'female') {
            loansOutstanding.women++;
            loansOutstandingValue.women += outstandingAmount;
          }
        } else {
          // Group/Entity loans
          loansOutstanding.groupEntities++;
          loansOutstandingValue.groupEntities += loan.outstandingBalance || loan.disbursedAmount || 0;
        }
      });
      
      loansOutstanding.total = loansOutstanding.men + loansOutstanding.women + loansOutstanding.groupEntities;
      loansOutstandingValue.total = loansOutstandingValue.men + loansOutstandingValue.women + loansOutstandingValue.groupEntities;
      
      // Loans by Economic Sector (simplified - would need sector tracking)
      const loansOutstandingBySector = {
        agriculture: 0,
        publicWorks: 0,
        commerce: 0,
        transport: 0,
        others: 0,
        total: loansOutstandingValue.total
      };
      
      // Loans by Classification
      const loansOutstandingByClassification = {
        normal: 0,
        watch: 0,
        substandard: 0,
        doubtful: 0,
        loss: 0,
        restructured: 0,
        total: loansOutstandingValue.total
      };
      
      loans.forEach(loan => {
        const classification = loan.classification?.status || 'normal';
        const amount = loan.outstandingBalance || loan.disbursedAmount || 0;
        
        if (loansOutstandingByClassification.hasOwnProperty(classification)) {
          loansOutstandingByClassification[classification] += amount;
        }
      });
      
      // Staff demographics
      const ndfspStaff = {
        men: staff.filter(s => s.gender === 'Male').length,
        women: staff.filter(s => s.gender === 'Female').length,
        total: staff.length
      };
      
      // Board members (would need specific role tracking)
      const ndfspBoardMembers = {
        men: 0,
        women: 0,
        total: 0
      };
      
      // Shareholders (would need specific tracking)
      const ndfspShareholders = {
        men: 0,
        women: 0,
        legalEntities: 0,
        total: 0,
        shareValue: 0
      };
      
      return {
        loansOutstanding,
        loansOutstandingValue,
        loansOutstandingBySector,
        loansOutstandingByClassification,
        loansDisbursed: loansOutstanding, // Simplified
        loansDisbursedValue: loansOutstandingValue, // Simplified
        loansDisbursedBySector: loansOutstandingBySector, // Simplified
        ndfspBorrowings: {
          shareholders: 0,
          relatedParties: 0,
          banksMicrofinance: 0,
          otherSources: 0,
          total: 0
        },
        financingWomenEntities: {
          disbursedLoans: 0,
          outstandingLoans: 0,
          disbursedValue: 0,
          outstandingValue: 0,
          numberOfAccounts: 0
        },
        financingSMEs: {
          disbursedLoans: 0,
          outstandingLoans: 0,
          disbursedValue: 0,
          outstandingValue: 0
        },
        financingYouthEntities: {
          disbursedLoans: 0,
          outstandingLoans: 0,
          disbursedValue: 0,
          outstandingValue: 0
        },
        newLoansApplied: {
          applied: 0,
          rejected: 0,
          appliedAmount: 0,
          rejectedAmount: 0
        },
        ndfspStaff,
        ndfspBoardMembers,
        ndfspShareholders
      };
      
    } catch (error) {
      console.error('Error calculating supplementary info:', error);
      throw error;
    }
  }
  
  /**
   * Calculate written-off loans
   */
  static async calculateWrittenOffLoans(startDate, endDate, branch = null) {
    try {
      const query = {
        status: 'completed',
        classification: { status: 'writeoff' },
        completionDate: { $gte: startDate, $lte: endDate }
      };
      
      if (branch) {
        query.branch = branch;
      }
      
      const writtenOffLoans = await Loan.find(query);
      return writtenOffLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
      
    } catch (error) {
      console.error('Error calculating written-off loans:', error);
      return 0;
    }
  }
  
  /**
   * Update existing report
   */
  static async updateExistingReport(report, startDate, endDate, branch) {
    try {
      const updatedData = await this.calculateReportData(startDate, endDate, branch);
      
      report.balanceSheet = updatedData.balanceSheet;
      report.incomeStatement = updatedData.incomeStatement;
      report.supplementaryInfo = updatedData.supplementaryInfo;
      report.offBalanceSheet = updatedData.offBalanceSheet;
      
      await report.save();
      return report;
      
    } catch (error) {
      console.error('Error updating existing report:', error);
      throw error;
    }
  }

  /**
   * Update multi-period report
   */
  static async updateMultiPeriodReport(report, periods, branch) {
    try {
      const updatedPeriodsData = [];
      for (const periodInfo of periods) {
        const periodData = await this.calculateReportData(
          new Date(periodInfo.date.getFullYear(), periodInfo.date.getMonth(), 1),
          periodInfo.date,
          branch
        );
        updatedPeriodsData.push({
          period: periodInfo.period,
          date: periodInfo.date,
          data: periodData
        });
      }
      
      report.periods = updatedPeriodsData;
      await report.save();
      return report;
      
    } catch (error) {
      console.error('Error updating multi-period report:', error);
      throw error;
    }
  }
  
  /**
   * Export report to Excel format
   */
  static async exportToExcel(reportId) {
    try {
      const report = await NDFISReporting.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      
      // This would use a library like exceljs to generate Excel file
      // For now, return the report data
      return report;
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }
}

export default NDFISReportingService;
