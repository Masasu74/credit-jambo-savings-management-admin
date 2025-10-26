import Customer from '../models/customerModel.js';
// import Loan from '../models/loanModel.js';
import CreditScore from '../models/creditScoreModel.js';

/**
 * Credit Scoring Algorithm
 * Implements a comprehensive credit scoring system based on multiple factors
 */

// Factor weights for credit scoring
const FACTOR_WEIGHTS = {
  payment_history: 0.35,        // 35% - Most important
  credit_utilization: 0.30,     // 30% - Second most important
  length_of_credit: 0.15,       // 15% - Credit history length
  types_of_credit: 0.10,        // 10% - Mix of credit types
  new_credit: 0.10,             // 10% - Recent credit inquiries
  income_stability: 0.15,       // 15% - Employment and income stability
  behavioral_indicators: 0.10   // 10% - Overall financial behavior
};

// Risk level thresholds
const RISK_THRESHOLDS = {
  excellent: { min: 750, max: 850 },
  good: { min: 700, max: 749 },
  fair: { min: 650, max: 699 },
  poor: { min: 600, max: 649 },
  very_poor: { min: 300, max: 599 }
};

// Risk level mapping
const RISK_LEVEL_MAPPING = {
  excellent: 'low',
  good: 'low',
  fair: 'medium',
  poor: 'high',
  very_poor: 'very_high'
};

/**
 * Calculate payment history score (0-100)
 */
const calculatePaymentHistoryScore = (loans) => {
  if (!loans || loans.length === 0) return 50; // Neutral score for new customers
  
  let totalPayments = 0;
  let onTimePayments = 0;
  let latePayments = 0;
  let defaultedPayments = 0;
  
  loans.forEach(loan => {
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      loan.repaymentSchedule.forEach(payment => {
        totalPayments++;
        
        if (payment.status === 'Paid') {
          if (payment.paymentDate && payment.dueDate) {
            const daysLate = Math.ceil((new Date(payment.paymentDate) - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24));
            if (daysLate <= 0) {
              onTimePayments++;
            } else if (daysLate <= 30) {
              latePayments++;
            } else {
              defaultedPayments++;
            }
          } else {
            onTimePayments++; // Assume on time if no payment date
          }
        } else if (payment.status === 'Overdue') {
          defaultedPayments++;
        }
      });
    }
  });
  
  if (totalPayments === 0) return 50;
  
  const onTimeRate = (onTimePayments / totalPayments) * 100;
  const lateRate = (latePayments / totalPayments) * 100;
  const defaultRate = (defaultedPayments / totalPayments) * 100;
  
  // Calculate score based on payment behavior
  let score = onTimeRate * 1.0 + lateRate * 0.5 + defaultRate * 0.0;
  
  // Bonus for consistent payment history
  if (totalPayments >= 12 && onTimeRate >= 90) score += 10;
  if (totalPayments >= 24 && onTimeRate >= 95) score += 15;
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate credit utilization score (0-100)
 */
const calculateCreditUtilizationScore = (loans, customer) => {
  if (!loans || loans.length === 0) return 70; // Good score for new customers
  
  const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
  const totalRepaid = loans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0);
  const activeLoans = loans.filter(loan => ['approved', 'disbursed'].includes(loan.status));
  const activeAmount = activeLoans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0);
  
  // Estimate monthly income
  const monthlyIncome = customer.employment?.salary || customer.employment?.monthlyRevenue || 0;
  
  if (monthlyIncome === 0) return 50; // Neutral score if no income data
  
  const debtToIncomeRatio = (activeAmount / monthlyIncome) * 100;
  const utilizationRate = totalBorrowed > 0 ? (activeAmount / totalBorrowed) * 100 : 0;
  
  let score = 100;
  
  // Penalize high debt-to-income ratio
  if (debtToIncomeRatio > 50) score -= 40;
  else if (debtToIncomeRatio > 40) score -= 30;
  else if (debtToIncomeRatio > 30) score -= 20;
  else if (debtToIncomeRatio > 20) score -= 10;
  
  // Penalize high utilization rate
  if (utilizationRate > 80) score -= 30;
  else if (utilizationRate > 60) score -= 20;
  else if (utilizationRate > 40) score -= 10;
  
  // Bonus for low utilization
  if (utilizationRate < 20) score += 10;
  if (debtToIncomeRatio < 15) score += 10;
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate length of credit history score (0-100)
 */
const calculateLengthOfCreditScore = (loans, customer) => {
  if (!loans || loans.length === 0) return 30; // Low score for new customers
  
  const now = new Date();
  const firstLoanDate = new Date(Math.min(...loans.map(loan => new Date(loan.createdAt))));
  const creditAgeInMonths = Math.floor((now - firstLoanDate) / (1000 * 60 * 60 * 24 * 30));
  
  let score = Math.min(100, creditAgeInMonths * 2); // 2 points per month, max 100
  
  // Bonus for longer credit history
  if (creditAgeInMonths >= 60) score += 20; // 5+ years
  else if (creditAgeInMonths >= 36) score += 15; // 3+ years
  else if (creditAgeInMonths >= 24) score += 10; // 2+ years
  else if (creditAgeInMonths >= 12) score += 5;  // 1+ year
  
  return Math.min(100, score);
};

/**
 * Calculate types of credit score (0-100)
 */
const calculateTypesOfCreditScore = (loans) => {
  if (!loans || loans.length === 0) return 50; // Neutral score for new customers
  
  const creditTypes = new Set(loans.map(loan => loan.loanType));
  const uniqueTypes = creditTypes.size;
  
  let score = 50; // Base score
  
  // Bonus for diverse credit types
  if (uniqueTypes >= 3) score += 30;
  else if (uniqueTypes >= 2) score += 20;
  else if (uniqueTypes >= 1) score += 10;
  
  // Bonus for secured loans (indicates responsible borrowing)
  if (creditTypes.has('secured')) score += 15;
  if (creditTypes.has('immovable')) score += 10;
  
  return Math.min(100, score);
};

/**
 * Calculate new credit score (0-100)
 */
const calculateNewCreditScore = (loans) => {
  if (!loans || loans.length === 0) return 70; // Good score for new customers
  
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  
  const recentLoans = loans.filter(loan => new Date(loan.createdAt) > sixMonthsAgo);
  const recentApplications = recentLoans.length;
  
  let score = 100;
  
  // Penalize too many recent applications
  if (recentApplications >= 5) score -= 40;
  else if (recentApplications >= 3) score -= 30;
  else if (recentApplications >= 2) score -= 20;
  else if (recentApplications >= 1) score -= 10;
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate employment and income stability score (0-100)
 */
const calculateEmploymentStabilityScore = (customer) => {
  let score = 50; // Base score
  
  const employment = customer.employment;
  if (!employment) return score;
  
  // Employment status scoring
  switch (employment.status) {
    case 'Employed':
      score += 30;
      break;
    case 'Self-Employed':
      score += 20;
      break;
    case 'Unemployed':
      score -= 20;
      break;
  }
  
  // Income level scoring
  const monthlyIncome = employment.salary || employment.monthlyRevenue || 0;
  if (monthlyIncome >= 500000) score += 20; // 500k+ RWF
  else if (monthlyIncome >= 300000) score += 15; // 300k+ RWF
  else if (monthlyIncome >= 200000) score += 10; // 200k+ RWF
  else if (monthlyIncome >= 100000) score += 5;  // 100k+ RWF
  else if (monthlyIncome > 0) score -= 10;       // Low income
  
  // Employment duration (estimated from hire date if available)
  if (employment.contractCertificate) score += 10; // Has employment proof
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate behavioral indicators score (0-100)
 */
const calculateBehavioralScore = (customer, loans) => {
  let score = 50; // Base score
  
  // Document completeness
  const requiredDocs = ['idFile', 'contractCertificate', 'businessCertificate'];
  const providedDocs = requiredDocs.filter(doc => customer[doc] || customer.employment?.[doc]);
  const docCompleteness = (providedDocs.length / requiredDocs.length) * 100;
  score += (docCompleteness - 50) * 0.3; // 30% weight
  
  // Address stability (simplified - could be enhanced with address history)
  if (customer.contact?.address?.province) score += 10;
  if (customer.contact?.address?.district) score += 5;
  
  // Communication responsiveness (simplified)
  if (customer.contact?.phone && customer.contact?.email) score += 10;
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Generate risk recommendations based on credit score and factors
 */
const generateRiskRecommendations = (creditScore, factors, loans, customer) => {
  const recommendations = [];
  
  // Base recommendations on credit score
  if (creditScore >= 750) {
    recommendations.push('approve');
  } else if (creditScore >= 700) {
    recommendations.push('approve');
    recommendations.push('approve_with_conditions');
  } else if (creditScore >= 650) {
    recommendations.push('approve_with_conditions');
    recommendations.push('require_collateral');
  } else if (creditScore >= 600) {
    recommendations.push('require_collateral');
    recommendations.push('reduce_amount');
    recommendations.push('increase_interest');
  } else {
    recommendations.push('manual_review');
    recommendations.push('require_guarantor');
  }
  
  // Additional recommendations based on specific factors
  const paymentHistoryFactor = factors.find(f => f.factor === 'payment_history');
  if (paymentHistoryFactor && paymentHistoryFactor.score < 50) {
    recommendations.push('require_collateral');
  }
  
  const utilizationFactor = factors.find(f => f.factor === 'credit_utilization');
  if (utilizationFactor && utilizationFactor.score < 40) {
    recommendations.push('reduce_amount');
  }
  
  // Employment-based recommendations
  if (customer.employment?.status === 'Unemployed') {
    recommendations.push('require_guarantor');
  }
  
  // Remove duplicates and return
  return [...new Set(recommendations)];
};

/**
 * Main credit scoring function
 */
export const calculateCreditScore = async (customerId, userId) => {
  try {
    // Fetch customer and their loan history
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const loans = await Loan.find({ customer: customerId }).sort({ createdAt: -1 });
    
    // Calculate individual factor scores
    const paymentHistoryScore = calculatePaymentHistoryScore(loans);
    const creditUtilizationScore = calculateCreditUtilizationScore(loans, customer);
    const lengthOfCreditScore = calculateLengthOfCreditScore(loans, customer);
    const typesOfCreditScore = calculateTypesOfCreditScore(loans);
    const newCreditScore = calculateNewCreditScore(loans);
    const employmentStabilityScore = calculateEmploymentStabilityScore(customer);
    const behavioralScore = calculateBehavioralScore(customer, loans);
    
    // Create factors array with weights
    const factors = [
      {
        factor: 'payment_history',
        score: paymentHistoryScore,
        weight: FACTOR_WEIGHTS.payment_history,
        details: {
          totalPayments: loans.reduce((sum, loan) => sum + (loan.repaymentSchedule?.length || 0), 0),
          onTimeRate: paymentHistoryScore
        }
      },
      {
        factor: 'credit_utilization',
        score: creditUtilizationScore,
        weight: FACTOR_WEIGHTS.credit_utilization,
        details: {
          totalBorrowed: loans.reduce((sum, loan) => sum + (loan.amount || 0), 0),
          activeAmount: loans.filter(l => ['approved', 'disbursed'].includes(l.status))
            .reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0)
        }
      },
      {
        factor: 'length_of_credit',
        score: lengthOfCreditScore,
        weight: FACTOR_WEIGHTS.length_of_credit,
        details: {
          creditAgeInMonths: loans.length > 0 ? 
            Math.floor((new Date() - new Date(Math.min(...loans.map(l => new Date(l.createdAt))))) / (1000 * 60 * 60 * 24 * 30)) : 0
        }
      },
      {
        factor: 'types_of_credit',
        score: typesOfCreditScore,
        weight: FACTOR_WEIGHTS.types_of_credit,
        details: {
          uniqueTypes: new Set(loans.map(loan => loan.loanType)).size
        }
      },
      {
        factor: 'new_credit',
        score: newCreditScore,
        weight: FACTOR_WEIGHTS.new_credit,
        details: {
          recentApplications: loans.filter(l => 
            new Date(l.createdAt) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          ).length
        }
      },
      {
        factor: 'income_stability',
        score: employmentStabilityScore,
        weight: FACTOR_WEIGHTS.income_stability,
        details: {
          employmentStatus: customer.employment?.status,
          monthlyIncome: customer.employment?.salary || customer.employment?.monthlyRevenue
        }
      },
      {
        factor: 'behavioral_indicators',
        score: behavioralScore,
        weight: FACTOR_WEIGHTS.behavioral_indicators,
        details: {
          documentCompleteness: 'calculated',
          addressStability: 'assessed'
        }
      }
    ];
    
    // Calculate weighted credit score (300-850 range)
    const weightedScore = factors.reduce((total, factor) => {
      return total + (factor.score * factor.weight);
    }, 0);
    
    // Convert to 300-850 scale
    const creditScore = Math.round(300 + (weightedScore * 5.5));
    
    // Determine risk level
    let overallRisk = 'fair';
    for (const [risk, threshold] of Object.entries(RISK_THRESHOLDS)) {
      if (creditScore >= threshold.min && creditScore <= threshold.max) {
        overallRisk = risk;
        break;
      }
    }
    
    const riskLevel = RISK_LEVEL_MAPPING[overallRisk];
    
    // Generate recommendations
    const recommendations = generateRiskRecommendations(creditScore, factors, loans, customer);
    
    // Calculate credit history metrics
    const creditHistory = {
      totalLoans: loans.length,
      activeLoans: loans.filter(l => ['approved', 'disbursed'].includes(l.status)).length,
      completedLoans: loans.filter(l => l.status === 'completed').length,
      defaultedLoans: loans.filter(l => l.status === 'overdue').length,
      totalBorrowed: loans.reduce((sum, loan) => sum + (loan.amount || 0), 0),
      totalRepaid: loans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0),
      averagePaymentDelay: 0, // Would need more detailed payment data
      lastPaymentDate: loans.length > 0 ? loans[0].createdAt : null,
      creditUtilization: creditUtilizationScore
    };
    
    // Calculate financial indicators
    const monthlyIncome = customer.employment?.salary || customer.employment?.monthlyRevenue || 0;
    const activeAmount = creditHistory.activeLoans > 0 ? 
      loans.filter(l => ['approved', 'disbursed'].includes(l.status))
        .reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0) : 0;
    
    const financialIndicators = {
      debtToIncomeRatio: monthlyIncome > 0 ? (activeAmount / monthlyIncome) * 100 : 0,
      incomeStability: employmentStabilityScore,
      employmentDuration: 0, // Would need employment history
      savingsRate: 0, // Would need savings data
      monthlyObligations: activeAmount
    };
    
    // Calculate behavioral indicators
    const behavioralIndicators = {
      paymentConsistency: paymentHistoryScore,
      communicationResponsiveness: behavioralScore,
      documentCompleteness: behavioralScore,
      addressStability: behavioralScore
    };
    
    // Create or update credit score record
    const creditScoreData = {
      customer: customerId,
      creditScore,
      riskAssessment: {
        overallRisk,
        riskScore: creditScore,
        riskLevel,
        factors,
        recommendations,
        notes: `Credit score calculated using algorithm version 1.0`,
        assessedBy: userId,
        assessedAt: new Date()
      },
      creditHistory,
      financialIndicators,
      behavioralIndicators,
      scoringMetadata: {
        algorithmVersion: '1.0',
        lastCalculated: new Date(),
        calculationMethod: 'automatic',
        dataPoints: factors.length,
        confidenceLevel: Math.min(100, Math.max(0, creditScore / 8.5)) // Simple confidence calculation
      },
      createdBy: userId,
      updatedBy: userId
    };
    
    // Upsert credit score record
    const existingCreditScore = await CreditScore.findOne({ customer: customerId });
    if (existingCreditScore) {
      Object.assign(existingCreditScore, creditScoreData);
      await existingCreditScore.save();
      return existingCreditScore;
    } else {
      return await CreditScore.create(creditScoreData);
    }
    
  } catch (error) {
    console.error('Error calculating credit score:', error);
    throw error;
  }
};

/**
 * Get credit score for a customer
 */
export const getCreditScore = async (customerId) => {
  try {
    const creditScore = await CreditScore.findOne({ customer: customerId })
      .populate('customer', 'personalInfo.fullName customerCode')
      .populate('assessedBy', 'fullName email');
    
    return creditScore;
  } catch (error) {
    console.error('Error fetching credit score:', error);
    throw error;
  }
};

/**
 * Get credit score statistics
 */
export const getCreditScoreStatistics = async () => {
  try {
    return await CreditScore.getStatistics();
  } catch (error) {
    console.error('Error fetching credit score statistics:', error);
    throw error;
  }
};

/**
 * Get customers by risk level
 */
export const getCustomersByRiskLevel = async (riskLevel) => {
  try {
    return await CreditScore.getByRiskLevel(riskLevel);
  } catch (error) {
    console.error('Error fetching customers by risk level:', error);
    throw error;
  }
};
