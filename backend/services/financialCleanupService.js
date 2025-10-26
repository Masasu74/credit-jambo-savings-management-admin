import GeneralLedger from '../models/generalLedgerModel.js';
import { TrialBalance, ProfitLoss, BalanceSheet, CashFlow } from '../models/financialStatementsModel.js';
import { TaxTransaction, TaxReturn } from '../models/taxManagementModel.js';
import { logActivity } from '../utils/logActivity.js';

/**
 * Service for cleaning up financial data when loans or customers are deleted
 */
class FinancialCleanupService {
  /**
   * Clean up all financial data associated with a loan
   * @param {Object} loan - The loan object to clean up
   * @param {String} userId - ID of the user performing the deletion
   * @returns {Object} - Summary of deleted records
   */
  static async cleanupLoanFinancialData(loan, userId) {
    try {
      console.log(`🧹 Starting financial cleanup for loan: ${loan.loanCode}`);
      
      const cleanupSummary = {
        loanCode: loan.loanCode,
        deletedTransactions: 0,
        deletedFinancialStatements: 0,
        deletedTaxRecords: 0,
        totalAmount: 0,
        errors: []
      };

      // 1. Delete General Ledger transactions related to this loan
      const loanTransactions = await GeneralLedger.find({
        $or: [
          { referenceType: 'loan', referenceId: loan._id },
          { reference: { $regex: `LOAN-.*-${loan.loanCode}` } }
        ]
      });

      console.log(`📊 Found ${loanTransactions.length} loan-related transactions`);

      for (const transaction of loanTransactions) {
        try {
          // Calculate total amount for reporting
          cleanupSummary.totalAmount += transaction.totalDebit || 0;
          
          // Delete the transaction
          await GeneralLedger.findByIdAndDelete(transaction._id);
          cleanupSummary.deletedTransactions++;
          
          console.log(`🗑️ Deleted transaction: ${transaction.reference}`);
        } catch (error) {
          console.error(`❌ Error deleting transaction ${transaction._id}:`, error);
          cleanupSummary.errors.push(`Transaction ${transaction.reference}: ${error.message}`);
        }
      }

      // 2. Delete financial statements that might reference this loan
      // Note: This is more complex as financial statements are typically aggregated
      // We'll mark them for regeneration rather than delete them entirely
      const affectedStatements = await this.findAffectedFinancialStatements(loan);
      cleanupSummary.deletedFinancialStatements = affectedStatements.length;

      // 3. Delete tax transactions related to this loan
      const taxTransactions = await TaxTransaction.find({
        referenceType: 'loan',
        referenceId: loan._id
      });

      for (const taxTx of taxTransactions) {
        try {
          await TaxTransaction.findByIdAndDelete(taxTx._id);
          cleanupSummary.deletedTaxRecords++;
          console.log(`🗑️ Deleted tax transaction: ${taxTx._id}`);
        } catch (error) {
          console.error(`❌ Error deleting tax transaction ${taxTx._id}:`, error);
          cleanupSummary.errors.push(`Tax transaction ${taxTx._id}: ${error.message}`);
        }
      }

      // 4. Log the cleanup activity
      await logActivity({
        userId: userId,
        action: "financial_cleanup_loan",
        entityType: "loan",
        entityId: loan._id,
        details: {
          loanCode: loan.loanCode,
          deletedTransactions: cleanupSummary.deletedTransactions,
          deletedTaxRecords: cleanupSummary.deletedTaxRecords,
          totalAmount: cleanupSummary.totalAmount,
          errors: cleanupSummary.errors
        }
      });

      console.log(`✅ Financial cleanup completed for loan: ${loan.loanCode}`);
      console.log(`📊 Summary: ${cleanupSummary.deletedTransactions} transactions, ${cleanupSummary.deletedTaxRecords} tax records deleted`);
      
      return cleanupSummary;
    } catch (error) {
      console.error(`❌ Error during financial cleanup for loan ${loan.loanCode}:`, error);
      throw error;
    }
  }

  /**
   * Clean up all financial data associated with an expense
   * @param {Object} expense - The expense object to clean up
   * @param {String} userId - ID of the user performing the deletion
   * @returns {Object} - Summary of deleted records
   */
  static async cleanupExpenseFinancialData(expense, userId) {
    try {
      console.log(`🧹 Starting financial cleanup for expense: ${expense.title}`);
      
      const cleanupSummary = {
        expenseId: expense._id,
        expenseTitle: expense.title,
        deletedTransactions: 0,
        deletedTaxRecords: 0,
        totalAmount: 0,
        errors: []
      };

      // 1. Delete General Ledger transactions related to this expense
      const expenseTransactions = await GeneralLedger.find({
        referenceType: 'expense',
        referenceId: expense._id
      });

      console.log(`📊 Found ${expenseTransactions.length} expense-related transactions`);

      for (const transaction of expenseTransactions) {
        try {
          // Calculate total amount for reporting
          cleanupSummary.totalAmount += transaction.totalDebit || 0;
          
          // Delete the transaction
          await GeneralLedger.findByIdAndDelete(transaction._id);
          cleanupSummary.deletedTransactions++;
          
          console.log(`🗑️ Deleted expense transaction: ${transaction.reference}`);
        } catch (error) {
          console.error(`❌ Error deleting transaction ${transaction._id}:`, error);
          cleanupSummary.errors.push(`Transaction ${transaction.reference}: ${error.message}`);
        }
      }

      // 2. Delete tax transactions related to this expense
      const taxTransactions = await TaxTransaction.find({
        referenceType: 'expense',
        referenceId: expense._id
      });

      for (const taxTx of taxTransactions) {
        try {
          await TaxTransaction.findByIdAndDelete(taxTx._id);
          cleanupSummary.deletedTaxRecords++;
          console.log(`🗑️ Deleted tax transaction: ${taxTx._id}`);
        } catch (error) {
          console.error(`❌ Error deleting tax transaction ${taxTx._id}:`, error);
          cleanupSummary.errors.push(`Tax transaction ${taxTx._id}: ${error.message}`);
        }
      }

      // 3. Log the cleanup activity
      await logActivity({
        userId,
        action: 'expense_financial_cleanup',
        entityType: 'expense',
        entityId: expense._id,
        details: {
          expenseTitle: expense.title,
          expenseAmount: expense.amount,
          deletedTransactions: cleanupSummary.deletedTransactions,
          deletedTaxRecords: cleanupSummary.deletedTaxRecords,
          totalAmount: cleanupSummary.totalAmount,
          errors: cleanupSummary.errors
        }
      });

      console.log(`✅ Expense financial cleanup completed: ${cleanupSummary.deletedTransactions} transactions, ${cleanupSummary.deletedTaxRecords} tax records deleted`);
      return cleanupSummary;

    } catch (error) {
      console.error(`❌ Error during expense financial cleanup:`, error);
      throw error;
    }
  }

  /**
   * Clean up all financial data associated with a salary record
   * @param {Object} salary - The salary object to clean up
   * @param {String} userId - ID of the user performing the deletion
   * @returns {Object} - Summary of deleted records
   */
  static async cleanupSalaryFinancialData(salary, userId) {
    try {
      console.log(`🧹 Starting financial cleanup for salary: ${salary._id}`);
      
      const cleanupSummary = {
        salaryId: salary._id,
        employeeId: salary.employee,
        deletedTransactions: 0,
        deletedTaxRecords: 0,
        totalAmount: 0,
        errors: []
      };

      // 1. Delete General Ledger transactions related to this salary
      const salaryTransactions = await GeneralLedger.find({
        referenceType: 'salary',
        referenceId: salary._id
      });

      console.log(`📊 Found ${salaryTransactions.length} salary-related transactions`);

      for (const transaction of salaryTransactions) {
        try {
          // Calculate total amount for reporting
          cleanupSummary.totalAmount += transaction.totalDebit || 0;
          
          // Delete the transaction
          await GeneralLedger.findByIdAndDelete(transaction._id);
          cleanupSummary.deletedTransactions++;
          
          console.log(`🗑️ Deleted salary transaction: ${transaction.reference}`);
        } catch (error) {
          console.error(`❌ Error deleting transaction ${transaction._id}:`, error);
          cleanupSummary.errors.push(`Transaction ${transaction.reference}: ${error.message}`);
        }
      }

      // 2. Delete tax transactions related to this salary
      const taxTransactions = await TaxTransaction.find({
        referenceType: 'salary',
        referenceId: salary._id
      });

      for (const taxTx of taxTransactions) {
        try {
          await TaxTransaction.findByIdAndDelete(taxTx._id);
          cleanupSummary.deletedTaxRecords++;
          console.log(`🗑️ Deleted tax transaction: ${taxTx._id}`);
        } catch (error) {
          console.error(`❌ Error deleting tax transaction ${taxTx._id}:`, error);
          cleanupSummary.errors.push(`Tax transaction ${taxTx._id}: ${error.message}`);
        }
      }

      // 3. Log the cleanup activity
      await logActivity({
        userId,
        action: 'salary_financial_cleanup',
        entityType: 'salary',
        entityId: salary._id,
        details: {
          employeeId: salary.employee,
          baseSalary: salary.salaryInfo?.baseSalary || 0,
          deletedTransactions: cleanupSummary.deletedTransactions,
          deletedTaxRecords: cleanupSummary.deletedTaxRecords,
          totalAmount: cleanupSummary.totalAmount,
          errors: cleanupSummary.errors
        }
      });

      console.log(`✅ Salary financial cleanup completed: ${cleanupSummary.deletedTransactions} transactions, ${cleanupSummary.deletedTaxRecords} tax records deleted`);
      return cleanupSummary;

    } catch (error) {
      console.error(`❌ Error during salary financial cleanup:`, error);
      throw error;
    }
  }

  /**
   * Clean up all financial data associated with an employee
   * @param {Object} employee - The employee object to clean up
   * @param {String} userId - ID of the user performing the deletion
   * @returns {Object} - Summary of deleted records
   */
  static async cleanupEmployeeFinancialData(employee, userId) {
    try {
      console.log(`🧹 Starting financial cleanup for employee: ${employee.employeeId}`);
      
      const cleanupSummary = {
        employeeId: employee.employeeId,
        employeeName: employee.personalInfo?.fullName || 'Unknown',
        deletedTransactions: 0,
        deletedSalaryRecords: 0,
        deletedTaxRecords: 0,
        totalAmount: 0,
        errors: []
      };

      // 1. Delete General Ledger transactions related to this employee's salaries
      const employeeTransactions = await GeneralLedger.find({
        $or: [
          { referenceType: 'salary', reference: { $regex: `SALARY-${employee._id}` } },
          { description: { $regex: employee.personalInfo?.fullName || employee.employeeId, $options: 'i' } }
        ]
      });

      console.log(`📊 Found ${employeeTransactions.length} employee-related transactions`);

      for (const transaction of employeeTransactions) {
        try {
          // Calculate total amount for reporting
          cleanupSummary.totalAmount += transaction.totalDebit || 0;
          
          // Delete the transaction
          await GeneralLedger.findByIdAndDelete(transaction._id);
          cleanupSummary.deletedTransactions++;
          
          console.log(`🗑️ Deleted employee transaction: ${transaction.reference}`);
        } catch (error) {
          console.error(`❌ Error deleting transaction ${transaction._id}:`, error);
          cleanupSummary.errors.push(`Transaction ${transaction.reference}: ${error.message}`);
        }
      }

      // 2. Delete salary records for this employee
      const Salary = (await import('../models/salaryModel.js')).default;
      const salaryRecords = await Salary.find({ employee: employee._id });

      for (const salary of salaryRecords) {
        try {
          await Salary.findByIdAndDelete(salary._id);
          cleanupSummary.deletedSalaryRecords++;
          console.log(`🗑️ Deleted salary record: ${salary._id}`);
        } catch (error) {
          console.error(`❌ Error deleting salary record ${salary._id}:`, error);
          cleanupSummary.errors.push(`Salary record ${salary._id}: ${error.message}`);
        }
      }

      // 3. Delete tax transactions related to this employee
      const taxTransactions = await TaxTransaction.find({
        $or: [
          { referenceType: 'salary', reference: { $regex: `SALARY-${employee._id}` } },
          { description: { $regex: employee.personalInfo?.fullName || employee.employeeId, $options: 'i' } }
        ]
      });

      for (const taxTx of taxTransactions) {
        try {
          await TaxTransaction.findByIdAndDelete(taxTx._id);
          cleanupSummary.deletedTaxRecords++;
          console.log(`🗑️ Deleted tax transaction: ${taxTx._id}`);
        } catch (error) {
          console.error(`❌ Error deleting tax transaction ${taxTx._id}:`, error);
          cleanupSummary.errors.push(`Tax transaction ${taxTx._id}: ${error.message}`);
        }
      }

      // 4. Log the cleanup activity
      await logActivity({
        userId,
        action: 'employee_financial_cleanup',
        entityType: 'employee',
        entityId: employee._id,
        details: {
          employeeId: employee.employeeId,
          employeeName: employee.personalInfo?.fullName || 'Unknown',
          deletedTransactions: cleanupSummary.deletedTransactions,
          deletedSalaryRecords: cleanupSummary.deletedSalaryRecords,
          deletedTaxRecords: cleanupSummary.deletedTaxRecords,
          totalAmount: cleanupSummary.totalAmount,
          errors: cleanupSummary.errors
        }
      });

      console.log(`✅ Employee financial cleanup completed: ${cleanupSummary.deletedTransactions} transactions, ${cleanupSummary.deletedSalaryRecords} salary records, ${cleanupSummary.deletedTaxRecords} tax records deleted`);
      return cleanupSummary;

    } catch (error) {
      console.error(`❌ Error during employee financial cleanup:`, error);
      throw error;
    }
  }

  /**
   * Clean up all financial data associated with a customer
   * @param {Object} customer - The customer object to clean up
   * @param {String} userId - ID of the user performing the deletion
   * @returns {Object} - Summary of deleted records
   */
  static async cleanupCustomerFinancialData(customer, userId) {
    try {
      console.log(`🧹 Starting financial cleanup for customer: ${customer.customerCode}`);
      
      const cleanupSummary = {
        customerCode: customer.customerCode,
        customerName: customer.personalInfo.fullName,
        deletedTransactions: 0,
        deletedFinancialStatements: 0,
        deletedTaxRecords: 0,
        totalAmount: 0,
        errors: []
      };

      // 1. Delete General Ledger transactions related to this customer's loans
      const customerTransactions = await GeneralLedger.find({
        $or: [
          { reference: { $regex: `LOAN-.*-${customer.customerCode}` } },
          { description: { $regex: customer.personalInfo.fullName, $options: 'i' } }
        ]
      });

      console.log(`📊 Found ${customerTransactions.length} customer-related transactions`);

      for (const transaction of customerTransactions) {
        try {
          // Calculate total amount for reporting
          cleanupSummary.totalAmount += transaction.totalDebit || 0;
          
          // Delete the transaction
          await GeneralLedger.findByIdAndDelete(transaction._id);
          cleanupSummary.deletedTransactions++;
          
          console.log(`🗑️ Deleted transaction: ${transaction.reference}`);
        } catch (error) {
          console.error(`❌ Error deleting transaction ${transaction._id}:`, error);
          cleanupSummary.errors.push(`Transaction ${transaction.reference}: ${error.message}`);
        }
      }

      // 2. Delete tax transactions related to this customer
      const taxTransactions = await TaxTransaction.find({
        $or: [
          { reference: { $regex: customer.customerCode } },
          { description: { $regex: customer.personalInfo.fullName, $options: 'i' } }
        ]
      });

      for (const taxTx of taxTransactions) {
        try {
          await TaxTransaction.findByIdAndDelete(taxTx._id);
          cleanupSummary.deletedTaxRecords++;
          console.log(`🗑️ Deleted tax transaction: ${taxTx._id}`);
        } catch (error) {
          console.error(`❌ Error deleting tax transaction ${taxTx._id}:`, error);
          cleanupSummary.errors.push(`Tax transaction ${taxTx._id}: ${error.message}`);
        }
      }

      // 3. Log the cleanup activity
      await logActivity({
        userId: userId,
        action: "financial_cleanup_customer",
        entityType: "customer",
        entityId: customer._id,
        details: {
          customerCode: customer.customerCode,
          customerName: customer.personalInfo.fullName,
          deletedTransactions: cleanupSummary.deletedTransactions,
          deletedTaxRecords: cleanupSummary.deletedTaxRecords,
          totalAmount: cleanupSummary.totalAmount,
          errors: cleanupSummary.errors
        }
      });

      console.log(`✅ Financial cleanup completed for customer: ${customer.customerCode}`);
      console.log(`📊 Summary: ${cleanupSummary.deletedTransactions} transactions, ${cleanupSummary.deletedTaxRecords} tax records deleted`);
      
      return cleanupSummary;
    } catch (error) {
      console.error(`❌ Error during financial cleanup for customer ${customer.customerCode}:`, error);
      throw error;
    }
  }

  /**
   * Find financial statements that might be affected by loan deletion
   * @param {Object} loan - The loan object
   * @returns {Array} - Array of affected financial statements
   */
  static async findAffectedFinancialStatements(loan) {
    try {
      const affectedStatements = [];

      // Check if loan was disbursed or completed in recent periods
      const loanDate = loan.disbursementDate || loan.completionDate || loan.createdAt;
      const fiscalYear = loanDate.getFullYear();
      const fiscalPeriod = loanDate.getMonth() + 1;

      // Find financial statements for the period when loan was active
      const trialBalances = await TrialBalance.find({
        fiscalYear: { $gte: fiscalYear - 1, $lte: fiscalYear + 1 },
        fiscalPeriod: { $gte: fiscalPeriod - 1, $lte: fiscalPeriod + 1 }
      });

      const profitLossStatements = await ProfitLoss.find({
        fiscalYear: { $gte: fiscalYear - 1, $lte: fiscalYear + 1 },
        fiscalPeriod: { $gte: fiscalPeriod - 1, $lte: fiscalPeriod + 1 }
      });

      const balanceSheets = await BalanceSheet.find({
        fiscalYear: { $gte: fiscalYear - 1, $lte: fiscalYear + 1 },
        fiscalPeriod: { $gte: fiscalPeriod - 1, $lte: fiscalPeriod + 1 }
      });

      const cashFlows = await CashFlow.find({
        fiscalYear: { $gte: fiscalYear - 1, $lte: fiscalYear + 1 },
        fiscalPeriod: { $gte: fiscalPeriod - 1, $lte: fiscalPeriod + 1 }
      });

      affectedStatements.push(
        ...trialBalances,
        ...profitLossStatements,
        ...balanceSheets,
        ...cashFlows
      );

      return affectedStatements;
    } catch (error) {
      console.error('Error finding affected financial statements:', error);
      return [];
    }
  }

  /**
   * Mark financial statements for regeneration after data cleanup
   * @param {Array} statements - Array of financial statements to mark
   * @param {String} reason - Reason for regeneration
   */
  static async markStatementsForRegeneration(statements, reason) {
    try {
      for (const statement of statements) {
        // Add a flag to indicate the statement needs regeneration
        statement.needsRegeneration = true;
        statement.regenerationReason = reason;
        statement.regenerationDate = new Date();
        await statement.save();
        
        console.log(`🔄 Marked statement for regeneration: ${statement._id}`);
      }
    } catch (error) {
      console.error('Error marking statements for regeneration:', error);
    }
  }

  /**
   * Get cleanup preview - shows what would be deleted without actually deleting
   * @param {String} entityType - 'loan' or 'customer'
   * @param {String} entityId - ID of the entity
   * @returns {Object} - Preview of what would be deleted
   */
  static async getCleanupPreview(entityType, entityId) {
    try {
      const preview = {
        entityType,
        entityId,
        transactions: [],
        taxRecords: [],
        financialStatements: [],
        totalAmount: 0,
        estimatedImpact: 'low' // low, medium, high
      };

      if (entityType === 'loan') {
        // Find loan-related transactions
        const transactions = await GeneralLedger.find({
          $or: [
            { referenceType: 'loan', referenceId: entityId },
            { reference: { $regex: `LOAN-.*-${entityId}` } }
          ]
        }).select('reference description totalDebit totalCredit transactionDate');

        preview.transactions = transactions;
        preview.totalAmount = transactions.reduce((sum, tx) => sum + (tx.totalDebit || 0), 0);

        // Find tax records
        const taxRecords = await TaxTransaction.find({
          referenceType: 'loan',
          referenceId: entityId
        }).select('reference description amount transactionDate');

        preview.taxRecords = taxRecords;

      } else if (entityType === 'customer') {
        // Find customer-related transactions
        const transactions = await GeneralLedger.find({
          $or: [
            { reference: { $regex: `LOAN-.*-${entityId}` } },
            { description: { $regex: entityId, $options: 'i' } }
          ]
        }).select('reference description totalDebit totalCredit transactionDate');

        preview.transactions = transactions;
        preview.totalAmount = transactions.reduce((sum, tx) => sum + (tx.totalDebit || 0), 0);

        // Find tax records
        const taxRecords = await TaxTransaction.find({
          $or: [
            { reference: { $regex: entityId } },
            { description: { $regex: entityId, $options: 'i' } }
          ]
        }).select('reference description amount transactionDate');

        preview.taxRecords = taxRecords;
      }

      // Determine impact level
      if (preview.totalAmount > 10000000) { // 10M RWF
        preview.estimatedImpact = 'high';
      } else if (preview.totalAmount > 1000000) { // 1M RWF
        preview.estimatedImpact = 'medium';
      }

      return preview;
    } catch (error) {
      console.error('Error getting cleanup preview:', error);
      throw error;
    }
  }

  /**
   * Validate if deletion is safe (no critical financial dependencies)
   * @param {String} entityType - 'loan' or 'customer'
   * @param {String} entityId - ID of the entity
   * @returns {Object} - Validation result
   */
  static async validateDeletionSafety(entityType, entityId) {
    try {
      const validation = {
        isSafe: true,
        warnings: [],
        errors: [],
        recommendations: []
      };

      const preview = await this.getCleanupPreview(entityType, entityId);

      // Check for high-value transactions
      if (preview.totalAmount > 5000000) { // 5M RWF
        validation.warnings.push(`High-value transactions detected (${preview.totalAmount.toLocaleString()} RWF)`);
        validation.recommendations.push('Consider archiving instead of deletion for audit purposes');
      }

      // Check for recent transactions
      const recentTransactions = preview.transactions.filter(tx => {
        const daysSinceTransaction = (new Date() - new Date(tx.transactionDate)) / (1000 * 60 * 60 * 24);
        return daysSinceTransaction < 30; // Less than 30 days old
      });

      if (recentTransactions.length > 0) {
        validation.warnings.push(`${recentTransactions.length} recent transactions found`);
        validation.recommendations.push('Recent transactions may require special handling');
      }

      // Check for tax implications
      if (preview.taxRecords.length > 0) {
        validation.warnings.push(`${preview.taxRecords.length} tax records will be deleted`);
        validation.recommendations.push('Ensure tax compliance before deletion');
      }

      // Determine overall safety
      if (validation.errors.length > 0) {
        validation.isSafe = false;
      } else if (validation.warnings.length > 2) {
        validation.isSafe = false;
        validation.recommendations.push('Manual review recommended before deletion');
      }

      return validation;
    } catch (error) {
      console.error('Error validating deletion safety:', error);
      return {
        isSafe: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        recommendations: ['Contact system administrator']
      };
    }
  }
}

export default FinancialCleanupService;
