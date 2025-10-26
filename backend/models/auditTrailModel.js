import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for system-generated events
  },
  
  // Session Information
  sessionId: {
    type: String,
    required: false
  },
  
  // Action Details
  action: {
    type: String,
    required: true,
    maxlength: 300
  },
  
  // Entity Information
  entityType: {
    type: String,
    enum: [
      'loan',
      'customer',
      'user',
      'branch',
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
      'session',
      'security',
      'settings',
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
      'financial_integration'
    ],
    required: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  
  // Detailed Information
  details: {
    type: Object,
    default: {}
  },
  
  // Request Information
  requestInfo: {
    method: String,
    url: String,
    ipAddress: String,
    userAgent: String,
    headers: Object,
    page: String, // Current page/route where action was performed
    pageTitle: String // Human-readable page title
  },
  
  // Changes Tracking
  changes: {
    before: Object,
    after: Object,
    fieldsChanged: [String]
  },
  
  // Branch Information (removed for savings management system)
  // branch: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Branch',
  //   required: false
  // },
  
  // Security Information
  security: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    flags: [String]
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  metadata: {
    duration: Number, // Time taken for the action in milliseconds
    success: {
      type: Boolean,
      default: true
    },
    errorMessage: String,
    stackTrace: String
  }
});

// Indexes for performance
auditTrailSchema.index({ user: 1, timestamp: -1 });
auditTrailSchema.index({ entityType: 1, entityId: 1 });
auditTrailSchema.index({ action: 1 });
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ 'security.riskLevel': 1 });
auditTrailSchema.index({ sessionId: 1 });
// auditTrailSchema.index({ branch: 1 }); // Removed for savings management system

// Virtual for formatted timestamp
auditTrailSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Ensure virtuals are included in JSON output
auditTrailSchema.set('toJSON', { virtuals: true });

export default mongoose.models.AuditTrail || mongoose.model('AuditTrail', auditTrailSchema);
