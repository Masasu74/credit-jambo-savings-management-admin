import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User who performed the action
    required: false // Optional for system-generated events
  },
  action: {
    type: String,
    required: true,
    maxlength: 300 // e.g., "Approved Loan", "Created Customer"
  },
  entityType: {
    type: String,
    enum: [
      'loan',
      'customer',
      'user',
      'branch',
      'application',
      'notification',
      'system',
      'expense',
      'attendance',
      'leave',
      'holiday',
      'employee',
      'salary',
      'performance',
      'training',
      'disciplinary',
      'loan_product',
      'task',
      'chart_of_accounts',
      'loan_recovery_report',
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
      'session',
      'audit_trail',
      'mfa',
      'compliance',
      'tax_management',
      'financial_statements'
    ],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // May be null for system events not linked to a specific record
  },
  details: {
    type: Object // Flexible for custom logs like { field: old -> new }
  },
  // branch: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Branch',
  //   required: false // helpful for filtering branch-level activities
  // }, // Removed for savings management system
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Optional index for performance
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ user: 1 });
activitySchema.index({ timestamp: -1 });

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema);
