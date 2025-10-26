import GeneralLedger from '../models/generalLedgerModel.js';
import ChartOfAccounts from '../models/chartOfAccountsModel.js';
import { logActivity } from '../utils/logActivity.js';

class FinancialIntegrationService {
  /**
   * Create General Ledger entry for loan disbursement
   */
  static async recordLoanDisbursement(loan, userId) {
    try {
      // Get account IDs
      const loansReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '1200' });
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });
      const feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6100' }); // Fee Income account

      if (!loansReceivableAccount || !cashAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      // Calculate fees from loan product - REQUIRED
      let totalFees = 0;
      let loanProduct = null;
      
      if (loan.product) {
        try {
          const LoanProduct = (await import('../models/loanProductModel.js')).default;
          loanProduct = await LoanProduct.findById(loan.product);
          if (loanProduct) {
            totalFees = loanProduct.calculateTotalFees(loan.disbursedAmount);
            console.log(`📊 Loan Product: ${loanProduct.productCode} - Fees: ${totalFees.toLocaleString()} RWF`);
            console.log(`   Processing Fee: ${loanProduct.calculateProcessingFee(loan.disbursedAmount).toLocaleString()} RWF`);
            console.log(`   Application Fee: ${loanProduct.calculateApplicationFee(loan.disbursedAmount).toLocaleString()} RWF`);
            console.log(`   Disbursement Fee: ${loanProduct.calculateDisbursementFee(loan.disbursedAmount).toLocaleString()} RWF`);
            console.log(`   Insurance Fee: ${(loanProduct.fees.insuranceFee || 0).toLocaleString()} RWF`);
            console.log(`   Legal Fee: ${(loanProduct.fees.legalFee || 0).toLocaleString()} RWF`);
          }
        } catch (error) {
          console.error('Error calculating fees from loan product:', error);
          throw new Error(`Failed to calculate fees from loan product: ${error.message}`);
        }
      } else {
        throw new Error('Loan product is required for fee calculation');
      }

      const transaction = new GeneralLedger({
        transactionDate: loan.disbursementDate || new Date(),
        reference: `LOAN-DISB-${loan.loanCode}`,
        referenceType: 'loan',
        referenceId: loan._id,
        description: `Loan disbursement - ${loan.loanCode} to ${loan.customer?.personalInfo?.fullName || 'Customer'} (Product: ${loanProduct?.productCode || 'N/A'}, Fees: ${totalFees.toLocaleString()})`,
        entries: [
          {
            account: loansReceivableAccount._id,
            debit: loan.disbursedAmount + totalFees, // Include fees in receivables
            credit: 0
          },
          {
            account: cashAccount._id,
            debit: 0,
            credit: loan.disbursedAmount
          }
        ],
        totalDebit: loan.disbursedAmount + totalFees,
        totalCredit: loan.disbursedAmount + totalFees,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: userId
      });

      // Add fee income entry if fees exist
      if (totalFees > 0 && feeIncomeAccount) {
        transaction.entries.push({
          account: feeIncomeAccount._id,
          debit: 0,
          credit: totalFees
        });
        transaction.totalCredit = loan.disbursedAmount + totalFees;
      }

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(loansReceivableAccount._id, loan.disbursedAmount + totalFees, 'debit');
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
          loanProduct: loanProduct?.productCode || 'N/A',
          disbursedAmount: loan.disbursedAmount,
          totalFees,
          transactionId: transaction._id
        }
      });

      console.log(`✅ Loan disbursement recorded: ${loan.loanCode} - ${loan.disbursedAmount.toLocaleString()} + Fees: ${totalFees.toLocaleString()} RWF`);
      return transaction;

    } catch (error) {
      console.error('❌ Error recording loan disbursement:', error);
      throw error;
    }
  }

  /**
   * Create General Ledger entry for loan payment
   */
  static async recordLoanPayment(loan, paymentAmount, paymentDate, userId) {
    try {
      // Get account IDs
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });
      const loansReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '1200' });

      if (!cashAccount || !loansReceivableAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      // Handle negative amounts (reversals)
      const isReversal = paymentAmount < 0;
      const absoluteAmount = Math.abs(paymentAmount);
      
      const transaction = new GeneralLedger({
        transactionDate: paymentDate || new Date(),
        reference: isReversal ? `LOAN-REV-${loan.loanCode}` : `LOAN-PAY-${loan.loanCode}`,
        referenceType: isReversal ? 'reversal' : 'payment',
        referenceId: loan._id,
        description: isReversal 
          ? `Loan payment reversal - ${loan.loanCode} from ${loan.customer?.personalInfo?.fullName || 'Customer'}`
          : `Loan payment - ${loan.loanCode} from ${loan.customer?.personalInfo?.fullName || 'Customer'}`,
        entries: [
          {
            account: cashAccount._id,
            debit: isReversal ? 0 : absoluteAmount,
            credit: isReversal ? absoluteAmount : 0
          },
          {
            account: loansReceivableAccount._id,
            debit: isReversal ? absoluteAmount : 0,
            credit: isReversal ? 0 : absoluteAmount
          }
        ],
        totalDebit: absoluteAmount,
        totalCredit: absoluteAmount,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: userId
      });

      await transaction.save();

      // Update account balances
      if (isReversal) {
        // For reversals, reduce cash and increase loan receivable
        await this.updateAccountBalance(cashAccount._id, absoluteAmount, 'credit');
        await this.updateAccountBalance(loansReceivableAccount._id, absoluteAmount, 'debit');
      } else {
        // For payments, increase cash and reduce loan receivable
        await this.updateAccountBalance(cashAccount._id, absoluteAmount, 'debit');
        await this.updateAccountBalance(loansReceivableAccount._id, absoluteAmount, 'credit');
      }

      // Log activity
      await logActivity({
        userId,
        action: isReversal ? 'loan_payment_reversed' : 'loan_payment_recorded',
        entityType: 'loan',
        entityId: loan._id,
        details: {
          loanCode: loan.loanCode,
          paymentAmount: absoluteAmount,
          isReversal,
          transactionId: transaction._id
        }
      });

      console.log(`✅ Loan ${isReversal ? 'payment reversal' : 'payment'} recorded: ${loan.loanCode} - ${absoluteAmount.toLocaleString()} RWF`);
      return transaction;

    } catch (error) {
      console.error('❌ Error recording loan payment:', error);
      throw error;
    }
  }

  /**
   * Create General Ledger entry for interest earned
   */
  static async recordInterestEarned(loan, interestAmount, interestDate, userId) {
    try {
      // Get account IDs
      const interestReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '1300' });
      const interestIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6100' });

      if (!interestReceivableAccount || !interestIncomeAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      // Get loan product for proper interest calculation
      let loanProduct = null;
      let calculatedInterest = interestAmount;
      
      if (loan.product) {
        try {
          const LoanProduct = (await import('../models/loanProductModel.js')).default;
          loanProduct = await LoanProduct.findById(loan.product);
          if (loanProduct && loanProduct.interestRate) {
            // Calculate interest based on loan product's interest rate
            const rate = loanProduct.interestRate.rate;
            const type = loanProduct.interestRate.type || 'flat';
            const frequency = loanProduct.interestRate.frequency || 'monthly';
            
            // Calculate interest based on type and frequency
            if (type === 'flat') {
              calculatedInterest = (loan.disbursedAmount * rate * loan.durationMonths) / (12 * 100);
            } else if (type === 'reducing') {
              // For reducing balance, calculate monthly interest
              calculatedInterest = (loan.disbursedAmount * rate) / (12 * 100);
            } else if (type === 'compound') {
              // For compound interest
              calculatedInterest = loan.disbursedAmount * (Math.pow(1 + rate/100, loan.durationMonths/12) - 1);
            }
            
            console.log(`📊 Loan Product Interest: ${rate}% ${type} (${frequency})`);
            console.log(`   Calculated Interest: ${calculatedInterest.toLocaleString()} RWF`);
            console.log(`   Principal: ${loan.disbursedAmount.toLocaleString()} RWF`);
            console.log(`   Duration: ${loan.durationMonths} months`);
          }
        } catch (error) {
          console.error('Error getting loan product for interest calculation:', error);
          // Use provided interest amount if product lookup fails
          calculatedInterest = interestAmount;
        }
      }

      // Calculate fees if loan product exists
      let totalFees = 0;
      if (loanProduct) {
        totalFees = loanProduct.calculateTotalFees(loan.disbursedAmount);
      }

      const transaction = new GeneralLedger({
        transactionDate: interestDate || new Date(),
        reference: `INT-EARN-${loan.loanCode}`,
        referenceType: 'loan',
        referenceId: loan._id,
        description: `Interest earned - ${loan.loanCode} from ${loan.customer?.personalInfo?.fullName || 'Customer'} (Product: ${loanProduct?.productCode || 'N/A'}, Interest: ${calculatedInterest.toLocaleString()}, Fees: ${totalFees.toLocaleString()})`,
        entries: [
          {
            account: interestReceivableAccount._id,
            debit: calculatedInterest + totalFees, // Include fees in receivables
            credit: 0
          },
          {
            account: interestIncomeAccount._id,
            debit: 0,
            credit: calculatedInterest + totalFees // Include fees in income
          }
        ],
        totalDebit: calculatedInterest + totalFees,
        totalCredit: calculatedInterest + totalFees,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: userId
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(interestReceivableAccount._id, calculatedInterest + totalFees, 'debit');
      await this.updateAccountBalance(interestIncomeAccount._id, calculatedInterest + totalFees, 'credit');

      // Log activity
      await logActivity({
        userId,
        action: 'interest_earned_recorded',
        entityType: 'loan',
        entityId: loan._id,
        details: {
          loanCode: loan.loanCode,
          loanProduct: loanProduct?.productCode || 'N/A',
          disbursedAmount: loan.disbursedAmount,
          interestRate: loanProduct?.interestRate?.rate || 'N/A',
          interestType: loanProduct?.interestRate?.type || 'N/A',
          calculatedInterest,
          totalFees,
          transactionId: transaction._id
        }
      });

      console.log(`✅ Interest earned recorded: ${loan.loanCode} - ${calculatedInterest.toLocaleString()} + Fees: ${totalFees.toLocaleString()} RWF`);
      return transaction;

    } catch (error) {
      console.error('❌ Error recording interest earned:', error);
      throw error;
    }
  }

  /**
   * Create General Ledger entry for penalty income
   */
  static async recordPenaltyIncome(loan, penaltyAmount, penaltyDate, userId) {
    try {
      // Get account IDs
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });
      const penaltyIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6300' });

      if (!cashAccount || !penaltyIncomeAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      const transaction = new GeneralLedger({
        transactionDate: penaltyDate || new Date(),
        reference: `PENALTY-${loan.loanCode}`,
        referenceType: 'loan',
        referenceId: loan._id,
        description: `Penalty income - ${loan.loanCode} from ${loan.customer?.personalInfo?.fullName || 'Customer'}`,
        entries: [
          {
            account: cashAccount._id,
            debit: penaltyAmount,
            credit: 0
          },
          {
            account: penaltyIncomeAccount._id,
            debit: 0,
            credit: penaltyAmount
          }
        ],
        totalDebit: penaltyAmount,
        totalCredit: penaltyAmount,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: loan.branch,
        createdBy: userId
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(cashAccount._id, penaltyAmount, 'debit');
      await this.updateAccountBalance(penaltyIncomeAccount._id, penaltyAmount, 'credit');

      // Log activity
      await logActivity({
        userId,
        action: 'penalty_income_recorded',
        entityType: 'loan',
        entityId: loan._id,
        details: {
          loanCode: loan.loanCode,
          penaltyAmount,
          transactionId: transaction._id
        }
      });

      console.log(`✅ Penalty income recorded: ${loan.loanCode} - ${penaltyAmount.toLocaleString()} RWF`);
      return transaction;

    } catch (error) {
      console.error('❌ Error recording penalty income:', error);
      throw error;
    }
  }

  /**
   * Create General Ledger entry for expense
   */
  static async recordExpense(expense, userId) {
    try {
      // Get account IDs
      const expenseAccount = await ChartOfAccounts.findOne({ accountCode: '7400' }); // Office Supplies
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });

      if (!expenseAccount || !cashAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      // Map expense category to appropriate account
      const expenseAccountMap = {
        'Office Supplies': '7400',
        'Technology & Equipment': '2100',
        'Utilities & Rent': '7200',
        'Travel & Entertainment': '7300',
        'Marketing & Advertising': '7500',
        'Professional Services': '7600',
        'Insurance': '7700',
        'Other': '7800'
      };

      let targetExpenseAccount = expenseAccount;
      if (expense.category && expenseAccountMap[expense.category]) {
        const mappedAccount = await ChartOfAccounts.findOne({ accountCode: expenseAccountMap[expense.category] });
        if (mappedAccount) {
          targetExpenseAccount = mappedAccount;
        }
      }

      const transaction = new GeneralLedger({
        transactionDate: expense.expenseDate || new Date(),
        reference: `EXP-${expense._id}`,
        referenceType: 'expense',
        referenceId: expense._id,
        description: `Expense - ${expense.title} - ${expense.category}`,
        entries: [
          {
            account: targetExpenseAccount._id,
            debit: expense.amount,
            credit: 0
          },
          {
            account: cashAccount._id,
            debit: 0,
            credit: expense.amount
          }
        ],
        totalDebit: expense.amount,
        totalCredit: expense.amount,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: expense.branch,
        createdBy: userId
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(targetExpenseAccount._id, expense.amount, 'debit');
      await this.updateAccountBalance(cashAccount._id, expense.amount, 'credit');

      // Log activity
      await logActivity({
        userId,
        action: 'expense_recorded',
        entityType: 'expense',
        entityId: expense._id,
        details: {
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          transactionId: transaction._id
        }
      });

      console.log(`✅ Expense recorded: ${expense.title} - ${expense.amount.toLocaleString()} RWF`);
      return transaction;

    } catch (error) {
      console.error('❌ Error recording expense:', error);
      throw error;
    }
  }

  /**
   * Create General Ledger entry for loan completion
   */
  static async recordLoanCompletion(loan, completionType, userId) {
    try {
      // Get account IDs
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });
      const loansReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '1200' });
      const interestIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6100' });
      const feeIncomeAccount = await ChartOfAccounts.findOne({ accountCode: '6100' });

      if (!cashAccount || !loansReceivableAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      // Calculate outstanding amounts - ALWAYS use disbursedAmount
      const principalAmount = loan.disbursedAmount || 0;
      const totalInterest = loan.totalInterestEarned || 0;
      
      // Calculate fees from loan product
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
          totalFees = principalAmount * 0.03; // 1% application + 2% disbursement
        }
      } else {
        totalFees = principalAmount * 0.03; // 1% application + 2% disbursement
      }

      const totalAmountDue = principalAmount + totalInterest + totalFees;
      
      if (totalAmountDue > 0) {
        // Create comprehensive completion transaction
        const transaction = new GeneralLedger({
          transactionDate: new Date(),
          reference: `LOAN-COMP-${loan.loanCode}`,
          referenceType: 'payment',
          referenceId: loan._id,
          description: `Loan completion - ${loan.loanCode} - Principal: ${principalAmount.toLocaleString()}, Interest: ${totalInterest.toLocaleString()}, Fees: ${totalFees.toLocaleString()}`,
          entries: [
            {
              account: cashAccount._id,
              debit: totalAmountDue,
              credit: 0
            },
            {
              account: loansReceivableAccount._id,
              debit: 0,
              credit: principalAmount
            }
          ],
          totalDebit: totalAmountDue,
          totalCredit: totalAmountDue,
          fiscalYear: new Date().getFullYear(),
          fiscalPeriod: new Date().getMonth() + 1,
          branch: loan.branch,
          createdBy: userId
        });

        // Add interest income entry
        if (totalInterest > 0 && interestIncomeAccount) {
          transaction.entries.push({
            account: interestIncomeAccount._id,
            debit: 0,
            credit: totalInterest
          });
        }

        // Add fee income entry
        if (totalFees > 0 && feeIncomeAccount) {
          transaction.entries.push({
            account: feeIncomeAccount._id,
            debit: 0,
            credit: totalFees
          });
        }

        await transaction.save();

        // Update account balances
        await this.updateAccountBalance(cashAccount._id, totalAmountDue, 'debit');
        await this.updateAccountBalance(loansReceivableAccount._id, principalAmount, 'credit');
        
        if (totalInterest > 0 && interestIncomeAccount) {
          await this.updateAccountBalance(interestIncomeAccount._id, totalInterest, 'credit');
        }
        
        if (totalFees > 0 && feeIncomeAccount) {
          await this.updateAccountBalance(feeIncomeAccount._id, totalFees, 'credit');
        }

        // Log comprehensive completion activity
        await logActivity({
          userId,
          action: 'loan_completion_comprehensive',
          entityType: 'loan',
          entityId: loan._id,
          details: {
            loanCode: loan.loanCode,
            completionType,
            principalAmount,
            totalInterest,
            totalFees,
            totalAmountDue,
            transactionId: transaction._id,
            completionDate: new Date()
          }
        });

        console.log(`✅ Comprehensive loan completion recorded: ${loan.loanCode}`);
        console.log(`   Principal: ${principalAmount.toLocaleString()} RWF`);
        console.log(`   Interest: ${totalInterest.toLocaleString()} RWF`);
        console.log(`   Fees: ${totalFees.toLocaleString()} RWF`);
        console.log(`   Total: ${totalAmountDue.toLocaleString()} RWF`);
        
        return transaction;
      }
    } catch (error) {
      console.error('❌ Error recording loan completion:', error);
      throw error;
    }
  }

  /**
   * Create General Ledger entry for capital injection
   */
  static async recordCapitalInjection(amount, source, description, userId, branch) {
    try {
      // Get account IDs
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });
      const capitalAccount = await ChartOfAccounts.findOne({ accountCode: '3100' }); // Share Capital

      if (!cashAccount || !capitalAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      const transaction = new GeneralLedger({
        transactionDate: new Date(),
        reference: `CAPITAL-${source.toUpperCase()}`,
        referenceType: 'adjustment',
        referenceId: null,
        description: `Capital injection - ${source} - ${description}`,
        entries: [
          {
            account: cashAccount._id,
            debit: amount,
            credit: 0
          },
          {
            account: capitalAccount._id,
            debit: 0,
            credit: amount
          }
        ],
        totalDebit: amount,
        totalCredit: amount,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch,
        createdBy: userId
      });

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(cashAccount._id, amount, 'debit');
      await this.updateAccountBalance(capitalAccount._id, amount, 'credit');

      // Log comprehensive activity
      await logActivity({
        userId,
        action: 'Capital Injection Recorded',
        entityType: 'capital',
        entityId: null,
        details: {
          source,
          description,
          amount,
          transactionId: transaction._id
        }
      });

      console.log(`✅ Capital injection recorded: ${source} - ${amount.toLocaleString()} RWF`);
      return transaction;
    } catch (error) {
      console.error('❌ Error recording capital injection:', error);
      throw error;
    }
  }

  /**
   * Record loan write-off
   */
  static async recordLoanWriteOff(loan, writeOffAmount, reason, userId) {
    try {
      const loansReceivableAccount = await ChartOfAccounts.findOne({ accountCode: '1210' }); // Loan Receivables
      const writeOffExpenseAccount = await ChartOfAccounts.findOne({ accountCode: '7950' }); // Loan Write-off Expense

      if (!loansReceivableAccount || !writeOffExpenseAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      if (writeOffAmount > 0) {
        const transaction = new GeneralLedger({
          transactionDate: new Date(),
          reference: `WRITEOFF-${loan.loanCode}`,
          referenceType: 'adjustment',
          referenceId: loan._id,
          description: `Loan write-off - ${loan.loanCode} - ${reason}`,
          entries: [
            {
              account: writeOffExpenseAccount._id, // Debit Write-off Expense
              debit: writeOffAmount,
              credit: 0
            },
            {
              account: loansReceivableAccount._id, // Credit Loan Receivables
              debit: 0,
              credit: writeOffAmount
            }
          ],
          totalDebit: writeOffAmount,
          totalCredit: writeOffAmount,
          fiscalYear: new Date().getFullYear(),
          fiscalPeriod: new Date().getMonth() + 1,
          branch: loan.branch,
          createdBy: userId
        });

        await transaction.save();

        // Update account balances
        await this.updateAccountBalance(writeOffExpenseAccount._id, writeOffAmount, 'debit');
        await this.updateAccountBalance(loansReceivableAccount._id, writeOffAmount, 'credit');

        // Log comprehensive activity
        await logActivity({
          userId,
          action: 'Loan Write-off Recorded',
          entityType: 'loan',
          entityId: loan._id,
          details: {
            loanCode: loan.loanCode,
            writeOffAmount,
            reason,
            transactionId: transaction._id
          }
        });

        console.log(`✅ Loan write-off recorded: ${loan.loanCode} - ${writeOffAmount.toLocaleString()} RWF`);
        return transaction;
      }
    } catch (error) {
      console.error('❌ Error recording loan write-off:', error);
      throw error;
    }
  }

  /**
   * Record salary payment
   */
  static async recordSalaryPayment(salary, userId) {
    try {
      // Get account IDs
      const cashAccount = await ChartOfAccounts.findOne({ accountCode: '1100' });
      const salaryExpenseAccount = await ChartOfAccounts.findOne({ accountCode: '7100' });
      const taxPayableAccount = await ChartOfAccounts.findOne({ accountCode: '2200' });

      if (!cashAccount || !salaryExpenseAccount) {
        throw new Error('Required Chart of Accounts not found');
      }

      const totalSalary = salary.netSalary + (salary.taxAmount || 0);

      const transaction = new GeneralLedger({
        transactionDate: salary.paymentDate || new Date(),
        reference: `SALARY-${salary.employee?._id || 'EMP'}`,
        referenceType: 'salary',
        referenceId: salary._id,
        description: `Salary payment - ${salary.employee?.personalInfo?.fullName || 'Employee'} - Net: ${salary.netSalary.toLocaleString()}, Tax: ${(salary.taxAmount || 0).toLocaleString()}`,
        entries: [
          {
            account: salaryExpenseAccount._id, // Debit Salary Expense
            debit: totalSalary,
            credit: 0
          },
          {
            account: cashAccount._id, // Credit Cash
            debit: 0,
            credit: salary.netSalary
          }
        ],
        totalDebit: totalSalary,
        totalCredit: totalSalary,
        fiscalYear: new Date().getFullYear(),
        fiscalPeriod: new Date().getMonth() + 1,
        branch: salary.branch,
        createdBy: userId
      });

      // Add tax payable entry if tax exists
      if (salary.taxAmount && salary.taxAmount > 0 && taxPayableAccount) {
        transaction.entries.push({
          account: taxPayableAccount._id, // Credit Tax Payable
          debit: 0,
          credit: salary.taxAmount
        });
      }

      await transaction.save();

      // Update account balances
      await this.updateAccountBalance(salaryExpenseAccount._id, totalSalary, 'debit');
      await this.updateAccountBalance(cashAccount._id, salary.netSalary, 'credit');
      
      if (salary.taxAmount && salary.taxAmount > 0 && taxPayableAccount) {
        await this.updateAccountBalance(taxPayableAccount._id, salary.taxAmount, 'credit');
      }

      // Log comprehensive activity
      await logActivity({
        userId,
        action: 'Salary Payment Recorded',
        entityType: 'salary',
        entityId: salary._id,
        details: {
          employeeName: salary.employee?.personalInfo?.fullName || 'Employee',
          netSalary: salary.netSalary,
          taxAmount: salary.taxAmount || 0,
          totalSalary,
          transactionId: transaction._id,
          paymentDate: salary.paymentDate || new Date()
        }
      });

      console.log(`✅ Salary payment recorded: ${salary.employee?.personalInfo?.fullName || 'Employee'} - ${totalSalary.toLocaleString()} RWF`);
      return transaction;
    } catch (error) {
      console.error('❌ Error recording salary payment:', error);
      throw error;
    }
  }

  /**
   * Delete financial records for a loan when status changes
   */
  static async deleteLoanFinancialRecords(loan, reason, userId) {
    try {
      console.log(`🗑️ Deleting financial records for loan: ${loan.loanCode} - Reason: ${reason}`);
      
      // Find all financial records related to this loan
      const loanTransactions = await GeneralLedger.find({
        $or: [
          { referenceType: 'loan', referenceId: loan._id },
          { reference: { $regex: `^LOAN-.*-${loan.loanCode}$` } },
          { reference: { $regex: `^INT-EARN-${loan.loanCode}$` } },
          { reference: { $regex: `^PENALTY-${loan.loanCode}$` } },
          { reference: { $regex: `^LOAN-COMP-${loan.loanCode}$` } }
        ]
      });

      console.log(`📊 Found ${loanTransactions.length} financial records to delete for loan ${loan.loanCode}`);

      let deletedCount = 0;
      let totalReversedAmount = 0;

      for (const transaction of loanTransactions) {
        try {
          // Reverse the account balance changes
          for (const entry of transaction.entries) {
            const account = await ChartOfAccounts.findById(entry.account);
            if (account) {
              // Reverse the balance change
              if (entry.debit > 0) {
                account.currentBalance = (account.currentBalance || 0) - entry.debit;
              }
              if (entry.credit > 0) {
                account.currentBalance = (account.currentBalance || 0) + entry.credit;
              }
              await account.save();
              console.log(`🔄 Reversed balance for account ${account.accountCode}: ${account.currentBalance.toLocaleString()} RWF`);
            }
          }

          // Delete the transaction
          await GeneralLedger.findByIdAndDelete(transaction._id);
          deletedCount++;
          totalReversedAmount += transaction.totalDebit || transaction.totalCredit || 0;

          console.log(`✅ Deleted transaction: ${transaction.reference} - ${(transaction.totalDebit || transaction.totalCredit || 0).toLocaleString()} RWF`);
        } catch (error) {
          console.error(`❌ Error deleting transaction ${transaction.reference}:`, error);
        }
      }

      // Log the deletion activity
      await logActivity({
        userId,
        action: 'loan_financial_records_deleted',
        entityType: 'loan',
        entityId: loan._id,
        details: {
          loanCode: loan.loanCode,
          reason,
          deletedTransactions: deletedCount,
          totalReversedAmount,
          deletedAt: new Date()
        }
      });

      console.log(`✅ Successfully deleted ${deletedCount} financial records for loan ${loan.loanCode}`);
      console.log(`   Total amount reversed: ${totalReversedAmount.toLocaleString()} RWF`);
      
      return { deletedCount, totalReversedAmount };
    } catch (error) {
      console.error('❌ Error deleting loan financial records:', error);
      throw error;
    }
  }

  /**
   * Handle loan status change with proper financial record management
   */
  static async handleLoanStatusChange(loan, oldStatus, newStatus, userId) {
    try {
      console.log(`🔄 Handling loan status change: ${loan.loanCode} from ${oldStatus} to ${newStatus}`);

      // Define scenarios where financial records should be deleted
      const deleteFinancialRecordsScenarios = [
        // From disbursed back to approved
        { from: 'disbursed', to: 'approved' },
        // From completed to overdue
        { from: 'completed', to: 'overdue' },
        // From overdue to completed (delete old completion records)
        { from: 'overdue', to: 'completed' }
      ];

      // Check if we need to delete financial records
      const shouldDeleteRecords = deleteFinancialRecordsScenarios.some(
        scenario => scenario.from === oldStatus && scenario.to === newStatus
      );

      if (shouldDeleteRecords) {
        const reason = `Status change from ${oldStatus} to ${newStatus}`;
        await this.deleteLoanFinancialRecords(loan, reason, userId);
      }

      // Handle new financial record creation based on new status
      if (newStatus === 'disbursed' && oldStatus !== 'disbursed') {
        // Only create disbursement records if not already disbursed
        await this.recordLoanDisbursement(loan, userId);
      } else if (newStatus === 'completed' && oldStatus !== 'completed') {
        // Only create completion records if not already completed
        await this.recordLoanCompletion(loan, 'completed', userId);
      }

      console.log(`✅ Successfully handled loan status change: ${loan.loanCode}`);
    } catch (error) {
      console.error('❌ Error handling loan status change:', error);
      throw error;
    }
  }

  /**
   * Update account balance
   */
  static async updateAccountBalance(accountId, amount, type) {
    try {
      const account = await ChartOfAccounts.findById(accountId);
      if (account) {
        if (type === 'debit') {
          account.currentBalance = (account.currentBalance || 0) + amount;
        } else {
          account.currentBalance = (account.currentBalance || 0) - amount;
        }
        await account.save();
        console.log(`📊 Updated account balance: ${account.accountCode} - ${account.currentBalance.toLocaleString()} RWF`);
      }
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  }
}

export default FinancialIntegrationService;
