/**
 * Repayment Schedule Generator Utility
 * Handles generation of repayment schedules for different frequencies
 */

/**
 * Generate repayment schedule based on frequency
 * @param {Object} loan - Loan object
 * @param {Object} product - Loan product object (optional)
 * @returns {Array} Repayment schedule array
 */
export const generateRepaymentSchedule = (loan, product = null) => {
  const principal = loan.disbursedAmount || loan.amount || 0;
  const interestRate = loan.interestRate || 4.5;
  const startDate = loan.disbursementDate || loan.approvalDate || new Date();
  
  // Get frequency from product or default to monthly
  const frequency = product?.repaymentConfig?.frequency || 'monthly';
  
  let repaymentSchedule = [];
  
  switch (frequency) {
    case 'daily':
      repaymentSchedule = generateDailySchedule(principal, interestRate, loan.durationMonths, startDate, product);
      break;
    case 'weekly':
      repaymentSchedule = generateWeeklySchedule(principal, interestRate, loan.durationMonths, startDate, product);
      break;
    case 'bi-weekly':
      repaymentSchedule = generateBiWeeklySchedule(principal, interestRate, loan.durationMonths, startDate, product);
      break;
    case 'monthly':
      repaymentSchedule = generateMonthlySchedule(principal, interestRate, loan.durationMonths, startDate, product);
      break;
    case 'quarterly':
      repaymentSchedule = generateQuarterlySchedule(principal, interestRate, loan.durationMonths, startDate, product);
      break;
    case 'bullet':
      repaymentSchedule = generateBulletSchedule(principal, interestRate, loan.durationMonths, startDate, product);
      break;
    default:
      repaymentSchedule = generateMonthlySchedule(principal, interestRate, loan.durationMonths, startDate, product);
  }
  
  return repaymentSchedule;
};

/**
 * Generate daily repayment schedule
 */
const generateDailySchedule = (principal, interestRate, durationMonths, startDate, product) => {
  const schedule = [];
  const dailyInterestRate = interestRate / 100 / 30; // Convert monthly rate to daily
  const totalDays = durationMonths * 30; // Approximate days in months
  
  // Calculate daily payment amount
  const dailyPayment = (principal * dailyInterestRate * Math.pow(1 + dailyInterestRate, totalDays)) / 
                      (Math.pow(1 + dailyInterestRate, totalDays) - 1);
  
  let remainingBalance = principal;
  
  for (let i = 0; i < totalDays; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + i + 1);
    
    const interestPayment = remainingBalance * dailyInterestRate;
    const principalPayment = dailyPayment - interestPayment;
    
    schedule.push({
      dueDate,
      amountDue: dailyPayment,
      amountPaid: 0,
      status: "Pending",
      penalties: [],
      partialPayments: [],
      dayNumber: i + 1
    });
    
    remainingBalance -= principalPayment;
  }
  
  return schedule;
};

/**
 * Generate weekly repayment schedule
 */
const generateWeeklySchedule = (principal, interestRate, durationMonths, startDate, product) => {
  const schedule = [];
  const weeklyInterestRate = interestRate / 100 / 4; // Convert monthly rate to weekly
  const totalWeeks = Math.ceil(durationMonths * 4.33); // Approximate weeks in months
  
  const weeklyPayment = (principal * weeklyInterestRate * Math.pow(1 + weeklyInterestRate, totalWeeks)) / 
                        (Math.pow(1 + weeklyInterestRate, totalWeeks) - 1);
  
  let remainingBalance = principal;
  
  for (let i = 0; i < totalWeeks; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
    
    const interestPayment = remainingBalance * weeklyInterestRate;
    const principalPayment = weeklyPayment - interestPayment;
    
    schedule.push({
      dueDate,
      amountDue: weeklyPayment,
      amountPaid: 0,
      status: "Pending",
      penalties: [],
      partialPayments: [],
      weekNumber: i + 1
    });
    
    remainingBalance -= principalPayment;
  }
  
  return schedule;
};

/**
 * Generate bi-weekly repayment schedule
 */
const generateBiWeeklySchedule = (principal, interestRate, durationMonths, startDate, product) => {
  const schedule = [];
  const biWeeklyInterestRate = interestRate / 100 / 2; // Convert monthly rate to bi-weekly
  const totalBiWeeks = Math.ceil(durationMonths * 2.17); // Approximate bi-weeks in months
  
  const biWeeklyPayment = (principal * biWeeklyInterestRate * Math.pow(1 + biWeeklyInterestRate, totalBiWeeks)) / 
                          (Math.pow(1 + biWeeklyInterestRate, totalBiWeeks) - 1);
  
  let remainingBalance = principal;
  
  for (let i = 0; i < totalBiWeeks; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (i + 1) * 14);
    
    const interestPayment = remainingBalance * biWeeklyInterestRate;
    const principalPayment = biWeeklyPayment - interestPayment;
    
    schedule.push({
      dueDate,
      amountDue: biWeeklyPayment,
      amountPaid: 0,
      status: "Pending",
      penalties: [],
      partialPayments: [],
      biWeekNumber: i + 1
    });
    
    remainingBalance -= principalPayment;
  }
  
  return schedule;
};

/**
 * Generate monthly repayment schedule
 */
const generateMonthlySchedule = (principal, interestRate, durationMonths, startDate, product) => {
  const schedule = [];
  const monthlyInterestRate = interestRate / 100;
  
  const monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, durationMonths)) / 
                        (Math.pow(1 + monthlyInterestRate, durationMonths) - 1);
  
  let remainingBalance = principal;
  
  for (let i = 0; i < durationMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    
    schedule.push({
      dueDate,
      amountDue: monthlyPayment,
      amountPaid: 0,
      status: "Pending",
      penalties: [],
      partialPayments: [],
      monthNumber: i + 1
    });
    
    remainingBalance -= principalPayment;
  }
  
  return schedule;
};

/**
 * Generate quarterly repayment schedule
 */
const generateQuarterlySchedule = (principal, interestRate, durationMonths, startDate, product) => {
  const schedule = [];
  const quarterlyInterestRate = interestRate / 100 * 3; // Convert monthly rate to quarterly
  const totalQuarters = Math.ceil(durationMonths / 3);
  
  const quarterlyPayment = (principal * quarterlyInterestRate * Math.pow(1 + quarterlyInterestRate, totalQuarters)) / 
                          (Math.pow(1 + quarterlyInterestRate, totalQuarters) - 1);
  
  let remainingBalance = principal;
  
  for (let i = 0; i < totalQuarters; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i + 1) * 3);
    
    const interestPayment = remainingBalance * quarterlyInterestRate;
    const principalPayment = quarterlyPayment - interestPayment;
    
    schedule.push({
      dueDate,
      amountDue: quarterlyPayment,
      amountPaid: 0,
      status: "Pending",
      penalties: [],
      partialPayments: [],
      quarterNumber: i + 1
    });
    
    remainingBalance -= principalPayment;
  }
  
  return schedule;
};

/**
 * Generate bullet payment schedule
 */
const generateBulletSchedule = (principal, interestRate, durationMonths, startDate, product) => {
  const schedule = [];
  const monthlyInterestRate = interestRate / 100;
  const totalInterest = principal * monthlyInterestRate * durationMonths;
  
  // Interest payments (monthly)
  for (let i = 0; i < durationMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    
    const interestPayment = principal * monthlyInterestRate;
    
    schedule.push({
      dueDate,
      amountDue: interestPayment,
      amountPaid: 0,
      status: "Pending",
      penalties: [],
      partialPayments: [],
      monthNumber: i + 1,
      paymentType: "interest"
    });
  }
  
  // Principal payment (bullet)
  const finalDueDate = new Date(startDate);
  finalDueDate.setMonth(finalDueDate.getMonth() + durationMonths);
  
  schedule.push({
    dueDate: finalDueDate,
    amountDue: principal,
    amountPaid: 0,
    status: "Pending",
    penalties: [],
    partialPayments: [],
    paymentType: "principal"
  });
  
  return schedule;
};

/**
 * Calculate total loan amount including fees
 */
export const calculateTotalLoanAmount = (principal, product = null) => {
  let totalFees = 0;
  
  if (product) {
    // Calculate fees based on product configuration
    if (product.applicationFee && product.applicationFee > 0) {
      totalFees += principal * (product.applicationFee / 100);
    }
    if (product.disbursementFee && product.disbursementFee > 0) {
      totalFees += principal * (product.disbursementFee / 100);
    }
    if (product.processingFee && product.processingFee > 0) {
      totalFees += principal * (product.processingFee / 100);
    }
  } else {
    // Default fees if no product
    totalFees = principal * 0.03; // 1% application + 2% disbursement
  }
  
  return principal + totalFees;
};

/**
 * Get frequency display name
 */
export const getFrequencyDisplayName = (frequency) => {
  const frequencyNames = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'bi-weekly': 'Bi-weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'bullet': 'Bullet Payment'
  };
  
  return frequencyNames[frequency] || 'Monthly';
};

/**
 * Get frequency description for UI
 */
export const getFrequencyDescription = (frequency) => {
  const descriptions = {
    'daily': 'Payments are due every day',
    'weekly': 'Payments are due every week',
    'bi-weekly': 'Payments are due every two weeks',
    'monthly': 'Payments are due every month',
    'quarterly': 'Payments are due every quarter',
    'bullet': 'Interest payments monthly, principal at maturity'
  };
  
  return descriptions[frequency] || 'Payments are due every month';
};

