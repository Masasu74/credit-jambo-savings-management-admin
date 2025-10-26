import LoanClassificationReport from '../models/loanClassificationReportModel.js';
// import Loan from '../models/loanModel.js';
import Customer from '../models/customerModel.js';
import Branch from '../models/branchModel.js';
import User from '../models/userModel.js';

class LoanClassificationReportService {
  
  /**
   * Generate loan classification report for a specific classification type
   */
  static async generateLoanClassificationReport(classificationType, reportingPeriod, branch = null, userId) {
    try {
      console.log(`🔄 Generating ${classificationType} loan classification report for ${reportingPeriod}`);
      
      // Check if report already exists
      const existingReport = await LoanClassificationReport.findOne({
        classificationType,
        reportingPeriod: new Date(reportingPeriod),
        branch: branch || null
      });
      
      if (existingReport) {
        console.log('📋 Report already exists, updating...');
        return await this.updateExistingReport(existingReport, classificationType, reportingPeriod, branch);
      }
      
      // Get loans based on classification type
      const loans = await this.getLoansByClassification(classificationType, reportingPeriod, branch);
      
      // Generate loan records
      const loanRecords = await this.generateLoanRecords(loans, classificationType, reportingPeriod);
      
      // Get institution details
      const institutionDetails = await this.getInstitutionDetails();
      
      // Create new report
      const newReport = new LoanClassificationReport({
        ndfspName: institutionDetails.name,
        codeOfInstitution: institutionDetails.code,
        reportingPeriod: new Date(reportingPeriod),
        reportName: `Loan Classification Report (${classificationType.toUpperCase()})`,
        sector: institutionDetails.sector,
        district: institutionDetails.district,
        classificationType,
        portfolioAtRisk: this.getPortfolioAtRiskDescription(classificationType),
        minimumProvisioningRate: this.getMinimumProvisioningRate(classificationType),
        eligibleCollateralTypes: this.getEligibleCollateralTypes(),
        loanRecords,
        createdBy: userId
      });
      
      await newReport.save();
      
      console.log(`✅ ${classificationType} loan classification report generated successfully`);
      return newReport;
      
    } catch (error) {
      console.error(`❌ Error generating ${classificationType} loan classification report:`, error);
      throw error;
    }
  }
  
  /**
   * Get loans based on classification type
   */
  static async getLoansByClassification(classificationType, reportingPeriod, branch = null) {
    try {
      const query = {
        status: { $in: ['disbursed', 'overdue', 'completed'] },
        disbursementDate: { $lte: new Date(reportingPeriod) }
      };
      
      if (branch) {
        query.branch = branch;
      }
      
      // Add classification filter based on type
      if (classificationType === 'normal') {
        query.$or = [
          { 'classification.status': { $exists: false } },
          { 'classification.status': 'normal' }
        ];
      } else {
        query['classification.status'] = classificationType;
      }
      
      const loans = await Loan.find(query)
        .populate('customer', 'personalInfo contact employment')
        .populate('branch', 'name code')
        .populate('responsibleOfficer', 'fullName')
        .populate('product', 'name interestRate');
      
      return loans;
      
    } catch (error) {
      console.error('Error getting loans by classification:', error);
      throw error;
    }
  }
  
  /**
   * Generate loan records from loans data
   */
  static async generateLoanRecords(loans, classificationType, reportingPeriod) {
    try {
      const loanRecords = [];
      let recordNumber = 1;
      
      for (const loan of loans) {
        const record = await this.createLoanRecord(loan, recordNumber, classificationType, reportingPeriod);
        loanRecords.push(record);
        recordNumber++;
      }
      
      return loanRecords;
      
    } catch (error) {
      console.error('Error generating loan records:', error);
      throw error;
    }
  }
  
  /**
   * Create individual loan record
   */
  static async createLoanRecord(loan, recordNumber, classificationType, reportingPeriod) {
    try {
      const customer = loan.customer;
      const branch = loan.branch;
      const loanOfficer = loan.responsibleOfficer;
      
      // Calculate days overdue
      const daysOverdue = this.calculateDaysOverdue(loan, new Date(reportingPeriod));
      
      // Calculate provisions
      const provisioningRate = this.getProvisioningRate(classificationType);
      const provisionRequired = (loan.outstandingBalance || loan.disbursedAmount || 0) * (provisioningRate / 100);
      
      // Calculate installments
      const totalInstallments = loan.durationMonths || 1;
      const installmentsPaid = this.calculateInstallmentsPaid(loan);
      const installmentsOutstanding = totalInstallments - installmentsPaid;
      
      // Calculate amounts
      const disbursedAmount = loan.disbursedAmount || loan.amount || 0;
      const amountRepaid = disbursedAmount - (loan.outstandingBalance || 0);
      const balanceOutstanding = loan.outstandingBalance || 0;
      const netAmountDue = balanceOutstanding;
      
      return {
        recordNumber,
        borrowerName: customer?.personalInfo?.fullName || 'N/A',
        borrowerId: customer?.personalInfo?.idNumber || 'N/A',
        telephoneNumber: customer?.contact?.phone || 'N/A',
        gender: customer?.personalInfo?.gender || 'N/A',
        age: this.calculateAge(customer?.personalInfo?.dob),
        relationshipWithNDFSP: this.getRelationshipWithNDFSP(customer),
        maritalStatus: customer?.maritalStatus?.status || 'N/A',
        previousLoansPaidOnTime: this.getPreviousLoansStatus(customer),
        loanPurpose: loan.purpose || 'N/A',
        branchName: branch?.name || 'N/A',
        collateralType: this.getCollateralType(loan.collateral),
        collateralAmount: loan.collateral?.value || 0,
        borrowerDistrict: customer?.contact?.address?.district || 'N/A',
        borrowerSector: customer?.contact?.address?.sector || 'N/A',
        borrowerCell: customer?.contact?.address?.cell || 'N/A',
        borrowerVillage: customer?.contact?.address?.village || 'N/A',
        annualInterestRate: loan.interestRate || 0,
        interestRateCalculationMethod: 'Declining', // Default to declining
        loanOfficerName: loanOfficer?.fullName || 'N/A',
        disbursedAmount,
        disbursementDate: loan.disbursementDate || loan.approvalDate,
        maturityDate: loan.endDate || this.calculateMaturityDate(loan),
        repaymentFrequencyDays: 30, // Default monthly
        gracePeriodDays: 0,
        firstPaymentDate: this.calculateFirstPaymentDate(loan),
        lastPaymentDate: this.getLastPaymentDate(loan),
        arrearsStartDate: this.getArrearsStartDate(loan),
        cutOffDate: new Date(reportingPeriod),
        totalInstallments,
        installmentsPaid,
        installmentsOutstanding,
        amountRepaid,
        balanceOutstanding,
        eligibleCollateralProvided: loan.collateral?.value || 0,
        netAmountDue,
        daysOverdue,
        loanClass: classificationType.charAt(0).toUpperCase() + classificationType.slice(1),
        provisioningRate,
        provisionRequired,
        previousProvisions: 0,
        additionalProvisions: provisionRequired
      };
      
    } catch (error) {
      console.error('Error creating loan record:', error);
      throw error;
    }
  }
  
  /**
   * Calculate days overdue
   */
  static calculateDaysOverdue(loan, cutOffDate) {
    if (loan.status === 'completed') return 0;
    
    const maturityDate = loan.endDate || this.calculateMaturityDate(loan);
    if (!maturityDate) return 0;
    
    const today = new Date(cutOffDate);
    if (today <= maturityDate) return 0;
    
    return Math.ceil((today - maturityDate) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Calculate maturity date
   */
  static calculateMaturityDate(loan) {
    if (loan.endDate) return new Date(loan.endDate);
    if (!loan.approvalDate || !loan.durationMonths) return null;
    
    const maturity = new Date(loan.approvalDate);
    maturity.setMonth(maturity.getMonth() + loan.durationMonths);
    return maturity;
  }
  
  /**
   * Calculate installments paid
   */
  static calculateInstallmentsPaid(loan) {
    if (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0) return 0;
    
    return loan.repaymentSchedule.filter(repayment => repayment.status === 'Paid').length;
  }
  
  /**
   * Calculate age from date of birth
   */
  static calculateAge(dob) {
    if (!dob) return null;
    
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Get relationship with NDFSP
   */
  static getRelationshipWithNDFSP(customer) {
    // This would need to be determined based on customer data
    return 'Customer';
  }
  
  /**
   * Get previous loans status
   */
  static getPreviousLoansStatus(customer) {
    // This would need to be determined based on customer's loan history
    return true;
  }
  
  /**
   * Get collateral type
   */
  static getCollateralType(collateral) {
    if (!collateral || !collateral.type) return 'Other assets';
    
    const typeMapping = {
      'immovable_assets': 'Land and Building movable collaterals',
      'movable_assets': 'Other assets',
      'bonds': 'Government or the Central Bank Bills and Bonds',
      'fixed_bank_savings': 'cash collateral'
    };
    
    return typeMapping[collateral.type] || 'Other assets';
  }
  
  /**
   * Calculate first payment date
   */
  static calculateFirstPaymentDate(loan) {
    if (!loan.disbursementDate) return null;
    
    const firstPayment = new Date(loan.disbursementDate);
    firstPayment.setDate(firstPayment.getDate() + 30); // Default 30 days
    return firstPayment;
  }
  
  /**
   * Get last payment date
   */
  static getLastPaymentDate(loan) {
    if (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0) return null;
    
    const paidRepayments = loan.repaymentSchedule.filter(repayment => repayment.status === 'Paid');
    if (paidRepayments.length === 0) return null;
    
    const lastPaid = paidRepayments[paidRepayments.length - 1];
    return lastPaid.paymentDate || lastPaid.dueDate;
  }
  
  /**
   * Get arrears start date
   */
  static getArrearsStartDate(loan) {
    if (loan.status !== 'overdue') return null;
    
    // Find the first overdue repayment
    if (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0) return null;
    
    const overdueRepayment = loan.repaymentSchedule.find(repayment => 
      repayment.status === 'Overdue' || repayment.status === 'Pending'
    );
    
    return overdueRepayment?.dueDate || null;
  }
  
  /**
   * Get portfolio at risk description
   */
  static getPortfolioAtRiskDescription(classificationType) {
    const descriptions = {
      'normal': '0 days',
      'watch': '1 to 89 days',
      'substandard': '90 to 179 days',
      'doubtful': '180 to 359 days',
      'loss': '360 to 719 days'
    };
    
    return descriptions[classificationType] || '0 days';
  }
  
  /**
   * Get minimum provisioning rate
   */
  static getMinimumProvisioningRate(classificationType) {
    const rates = {
      'normal': 0,
      'watch': 1,
      'substandard': 20,
      'doubtful': 50,
      'loss': 100
    };
    
    return rates[classificationType] || 0;
  }
  
  /**
   * Get provisioning rate
   */
  static getProvisioningRate(classificationType) {
    return this.getMinimumProvisioningRate(classificationType);
  }
  
  /**
   * Get eligible collateral types
   */
  static getEligibleCollateralTypes() {
    return [
      'cash collateral',
      'Government or the Central Bank Bills and Bonds',
      'Other securities offered by the banks operating in Rwanda',
      'Land and Building movable collaterals',
      'Biological assets',
      'Other assets'
    ];
  }
  
  /**
   * Get institution details
   */
  static async getInstitutionDetails() {
    // This would typically come from system settings or configuration
    return {
      name: 'NDFSP Institution',
      code: 'NDFSP001',
      sector: 'Financial Services',
      district: 'Kigali'
    };
  }
  
  /**
   * Update existing report
   */
  static async updateExistingReport(report, classificationType, reportingPeriod, branch) {
    try {
      const loans = await this.getLoansByClassification(classificationType, reportingPeriod, branch);
      const loanRecords = await this.generateLoanRecords(loans, classificationType, reportingPeriod);
      
      report.loanRecords = loanRecords;
      await report.save();
      
      return report;
      
    } catch (error) {
      console.error('Error updating existing report:', error);
      throw error;
    }
  }
  
  /**
   * Export report to Excel format
   */
  static async exportToExcel(reportId) {
    try {
      const report = await LoanClassificationReport.findById(reportId);
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

export default LoanClassificationReportService;


