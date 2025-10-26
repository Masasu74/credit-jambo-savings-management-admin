/**
 * Utility to map technical loan field names to user-friendly descriptions
 * for activity logging and display purposes
 */

export const loanFieldMappings = {
  // Basic loan information
  loanType: 'Loan Type',
  amount: 'Loan Amount',
  interestRate: 'Interest Rate',
  purpose: 'Loan Purpose',
  durationMonths: 'Duration (Months)',
  customer: 'Customer',
  collateral: 'Collateral',
  
  // Dates
  approvalDate: 'Approval Date',
  startDate: 'Start Date',
  endDate: 'End Date',
  disbursementDate: 'Disbursement Date',
  
  // Status and codes
  status: 'Status',
  loanCode: 'Loan Code',
  branchCode: 'Branch Code',
  responsibleOfficer: 'Responsible Officer',
  
  // Financial details
  disbursedAmount: 'Disbursed Amount',
  product: 'Loan Product',
  rejectionReason: 'Rejection Reason',
  penaltyRate: 'Penalty Rate',
  
  // Requirements and documents
  existingRequirements: 'Requirements',
  documents: 'Documents',
  
  // Additional fields
  monthlyPayment: 'Monthly Payment',
  totalInterest: 'Total Interest',
  totalAmount: 'Total Amount',
  remainingBalance: 'Remaining Balance',
  lastPaymentDate: 'Last Payment Date',
  nextPaymentDate: 'Next Payment Date',
  overdueAmount: 'Overdue Amount',
  daysOverdue: 'Days Overdue'
};

/**
 * Format loan field names for display
 * @param {string} fieldName - Technical field name
 * @returns {string} User-friendly field name
 */
export const formatLoanFieldName = (fieldName) => {
  return loanFieldMappings[fieldName] || fieldName;
};

/**
 * Format loan update details for activity logging
 * @param {Object} updatedFields - Object containing updated field values
 * @param {Object} oldLoan - Previous loan data (optional)
 * @returns {Object} Formatted details for activity logging
 */
export const formatLoanUpdateDetails = (updatedFields, oldLoan = null) => {
  const formattedDetails = {};
  const changedFields = [];
  
  // Process each updated field
  Object.entries(updatedFields).forEach(([field, newValue]) => {
    const friendlyName = formatLoanFieldName(field);
    
    // Skip system fields
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(field)) {
      return;
    }
    
    // Format the value for display
    let displayValue = newValue;
    
    // Handle special formatting for different field types
    if (field === 'amount' || field === 'disbursedAmount') {
      displayValue = newValue ? `$${Number(newValue).toLocaleString()}` : 'Not set';
    } else if (field === 'interestRate' || field === 'penaltyRate') {
      displayValue = newValue ? `${newValue}%` : 'Not set';
    } else if (field === 'durationMonths') {
      displayValue = newValue ? `${newValue} months` : 'Not set';
    } else if (field.includes('Date') && newValue) {
      try {
        displayValue = new Date(newValue).toLocaleDateString();
      } catch (error) {
        displayValue = newValue;
      }
    } else if (field === 'status') {
      displayValue = newValue ? newValue.charAt(0).toUpperCase() + newValue.slice(1) : 'Not set';
    } else if (field === 'customer' && typeof newValue === 'object') {
      displayValue = newValue.fullName || newValue.name || newValue.email || 'Unknown Customer';
    } else if (field === 'product' && typeof newValue === 'object') {
      displayValue = newValue.name || newValue.category || 'Unknown Product';
    } else if (field === 'responsibleOfficer' && typeof newValue === 'object') {
      displayValue = newValue.fullName || newValue.name || newValue.email || 'Unknown Officer';
    } else if (field === 'branchCode' && typeof newValue === 'object') {
      displayValue = newValue.name || newValue.code || 'Unknown Branch';
    } else if (newValue === null || newValue === undefined || newValue === '') {
      displayValue = 'Not set';
    }
    
    formattedDetails[friendlyName] = displayValue;
    changedFields.push(friendlyName);
  });
  
  // Create a summary message
  const fieldCount = changedFields.length;
  let summaryMessage = '';
  
  if (fieldCount === 0) {
    summaryMessage = 'No changes made';
  } else if (fieldCount === 1) {
    summaryMessage = `Updated ${changedFields[0]}`;
  } else if (fieldCount <= 3) {
    summaryMessage = `Updated ${changedFields.join(', ')}`;
  } else {
    summaryMessage = `Updated ${fieldCount} fields: ${changedFields.slice(0, 2).join(', ')} and ${fieldCount - 2} more`;
  }
  
  return {
    summary: summaryMessage,
    changedFields: changedFields,
    fieldCount: fieldCount,
    details: formattedDetails
  };
};

/**
 * Create a user-friendly activity message for loan updates
 * @param {Object} updateDetails - Formatted update details
 * @param {Object} loan - Loan object
 * @returns {string} User-friendly activity message
 */
export const createLoanUpdateMessage = (updateDetails, loan) => {
  const loanCode = loan?.loanCode || 'Unknown Loan';
  const customerName = loan?.customer?.fullName || loan?.customer?.name || 'Unknown Customer';
  
  return `${updateDetails.summary} for loan ${loanCode} (${customerName})`;
};

export default {
  loanFieldMappings,
  formatLoanFieldName,
  formatLoanUpdateDetails,
  createLoanUpdateMessage
};
