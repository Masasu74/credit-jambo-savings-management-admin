import AuditTrail from '../models/auditTrailModel.js';
import Activity from '../models/activityModel.js';

// Enhanced financial audit trail logging
export const logFinancialActivity = async ({
  userId,
  action,
  entityType,
  entityId,
  details = {},
  changes = {},
  requestInfo = {},
  securityLevel = 'low',
  branch = null
}) => {
  try {
    // Log to Activity model (simple logging)
    const activity = new Activity({
      user: userId,
      action,
      entityType,
      entityId,
      details,
      branch,
      timestamp: new Date()
    });
    await activity.save();

    // Log to AuditTrail model (detailed audit trail)
    const auditTrail = new AuditTrail({
      user: userId,
      action,
      entityType,
      entityId,
      details,
      changes,
      requestInfo,
      branch,
      security: {
        riskLevel: securityLevel,
        suspiciousActivity: false,
        flags: []
      },
      timestamp: new Date()
    });
    await auditTrail.save();

    console.log(`✅ Financial activity logged: ${action} on ${entityType}`);
    return { activity, auditTrail };
  } catch (error) {
    console.error('❌ Error logging financial activity:', error);
    throw error;
  }
};

// Financial-specific audit trail functions
export const logChartOfAccountsActivity = async ({
  userId,
  action,
  accountId,
  accountCode,
  accountName,
  changes = {},
  requestInfo = {},
  branch = null
}) => {
  const details = {
    accountCode,
    accountName,
    actionType: action,
    timestamp: new Date().toISOString()
  };

  return await logFinancialActivity({
    userId,
    action: `Chart of Accounts: ${action}`,
    entityType: 'chart_of_accounts',
    entityId: accountId,
    details,
    changes,
    requestInfo,
    securityLevel: 'medium',
    branch
  });
};

export const logGeneralLedgerActivity = async ({
  userId,
  action,
  transactionId,
  reference,
  amount,
  changes = {},
  requestInfo = {},
  branch = null
}) => {
  const details = {
    reference,
    amount,
    actionType: action,
    timestamp: new Date().toISOString()
  };

  // Determine security level based on amount
  const securityLevel = amount > 1000000 ? 'high' : amount > 500000 ? 'medium' : 'low';

  return await logFinancialActivity({
    userId,
    action: `General Ledger: ${action}`,
    entityType: 'general_ledger',
    entityId: transactionId,
    details,
    changes,
    requestInfo,
    securityLevel,
    branch
  });
};

export const logFinancialStatementActivity = async ({
  userId,
  action,
  statementId,
  statementType,
  period,
  amount,
  changes = {},
  requestInfo = {},
  branch = null
}) => {
  const details = {
    statementType,
    period,
    amount,
    actionType: action,
    timestamp: new Date().toISOString()
  };

  // Determine security level based on statement type and amount
  let securityLevel = 'medium';
  if (statementType === 'balance_sheet' && amount > 10000000) securityLevel = 'high';
  if (statementType === 'profit_loss' && Math.abs(amount) > 5000000) securityLevel = 'high';

  return await logFinancialActivity({
    userId,
    action: `Financial Statement: ${action}`,
    entityType: 'financial_statement',
    entityId: statementId,
    details,
    changes,
    requestInfo,
    securityLevel,
    branch
  });
};

export const logTaxActivity = async ({
  userId,
  action,
  taxId,
  taxType,
  amount,
  period,
  changes = {},
  requestInfo = {},
  branch = null
}) => {
  const details = {
    taxType,
    amount,
    period,
    actionType: action,
    timestamp: new Date().toISOString()
  };

  const securityLevel = amount > 1000000 ? 'high' : 'medium';

  return await logFinancialActivity({
    userId,
    action: `Tax Management: ${action}`,
    entityType: 'tax_configuration',
    entityId: taxId,
    details,
    changes,
    requestInfo,
    securityLevel,
    branch
  });
};

export const logExpenseActivity = async ({
  userId,
  action,
  expenseId,
  amount,
  category,
  status,
  changes = {},
  requestInfo = {},
  branch = null
}) => {
  const details = {
    amount,
    category,
    status,
    actionType: action,
    timestamp: new Date().toISOString()
  };

  const securityLevel = amount > 1000000 ? 'high' : amount > 500000 ? 'medium' : 'low';

  return await logFinancialActivity({
    userId,
    action: `Expense: ${action}`,
    entityType: 'expense',
    entityId: expenseId,
    details,
    changes,
    requestInfo,
    securityLevel,
    branch
  });
};

export const logFinancialIntegrationActivity = async ({
  userId,
  action,
  integrationType,
  sourceEntity,
  targetEntity,
  amount,
  changes = {},
  requestInfo = {},
  branch = null
}) => {
  const details = {
    integrationType,
    sourceEntity,
    targetEntity,
    amount,
    actionType: action,
    timestamp: new Date().toISOString()
  };

  const securityLevel = amount > 1000000 ? 'high' : 'medium';

  return await logFinancialActivity({
    userId,
    action: `Financial Integration: ${action}`,
    entityType: 'financial_integration',
    entityId: null,
    details,
    changes,
    requestInfo,
    securityLevel,
    branch
  });
};

// Get financial audit trail with filtering
export const getFinancialAuditTrail = async ({
  startDate,
  endDate,
  entityType,
  userId,
  action,
  securityLevel,
  branch,
  page = 1,
  limit = 50
}) => {
  try {
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Entity type filter
    if (entityType) {
      query.entityType = entityType;
    }

    // User filter
    if (userId) {
      query.user = userId;
    }

    // Action filter
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    // Security level filter
    if (securityLevel) {
      query['security.riskLevel'] = securityLevel;
    }

    // Branch filter
    if (branch) {
      query.branch = branch;
    }

    const skip = (page - 1) * limit;

    const auditTrails = await AuditTrail.find(query)
      .populate('user', 'fullName email')
      .populate('branch', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditTrail.countDocuments(query);

    return {
      auditTrails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting financial audit trail:', error);
    throw error;
  }
};

// Get financial activity summary
export const getFinancialActivitySummary = async ({
  startDate,
  endDate,
  branch
}) => {
  try {
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Branch filter
    if (branch) {
      query.branch = branch;
    }

    // Financial entity types
    const financialEntityTypes = [
      'chart_of_accounts',
      'general_ledger',
      'financial_statement',
      'tax_configuration',
      'tax_transaction',
      'tax_return',
      'trial_balance',
      'profit_loss',
      'balance_sheet',
      'cash_flow',
      'financial_integration',
      'expense'
    ];

    query.entityType = { $in: financialEntityTypes };

    const summary = await AuditTrail.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            entityType: '$entityType',
            securityLevel: '$security.riskLevel'
          },
          count: { $sum: 1 },
          totalAmount: {
            $sum: {
              $cond: [
                { $isNumber: '$details.amount' },
                '$details.amount',
                0
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.entityType',
          totalCount: { $sum: '$count' },
          totalAmount: { $sum: '$totalAmount' },
          securityLevels: {
            $push: {
              level: '$_id.securityLevel',
              count: '$count'
            }
          }
        }
      }
    ]);

    return summary;
  } catch (error) {
    console.error('Error getting financial activity summary:', error);
    throw error;
  }
};

// Export existing logActivity for backward compatibility
export { logActivity } from './logActivity.js';
