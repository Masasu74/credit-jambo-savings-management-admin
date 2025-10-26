import mongoose from 'mongoose';

const inAppNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: [
      // Customer notifications
      'customer_added',
      'customer_updated',
      'customer_deleted',
      'customer_status_changed',
      
      // Loan notifications
      'loan_added',
      'loan_updated',
      'loan_deleted',
      'loan_status_changed',
      'loan_approved',
      'loan_rejected',
      'loan_disbursed',
      'loan_completed',
      'loan_overdue',
      'partial_payment_recorded',
      'repayment_schedule_generated',
      'penalty_applied',
      'penalty_paid',
      
      // User notifications
      'user_added',
      'user_updated',
      'user_deleted',
      'user_status_changed',
      'user_role_changed',
      'user_login',
      'user_logout',
      'user_password_changed',
      
      // Employee notifications
      'employee_added',
      'employee_updated',
      'employee_deleted',
      'employee_status_changed',
      'employee_transferred',
      
      // Task notifications
      'task_assignment',
      'task_status_changed',
      'task_completed',
      'task_overdue',
      'task_priority_changed',
      
      // Attendance notifications
      'attendance_alert',
      'attendance_late',
      'attendance_absent',
      'attendance_overtime',
      
      // Leave notifications
      'leave_requested',
      'leave_approved',
      'leave_rejected',
      'leave_cancelled',
      
      // Salary notifications
      'salary_processed',
      'salary_approved',
      'salary_disbursed',
      'salary_adjustment',
      
      // Performance notifications
      'performance_review',
      'performance_rating',
      'performance_goal_set',
      'performance_improvement',
      
      // Training notifications
      'training_scheduled',
      'training_completed',
      'training_cancelled',
      'training_reminder',
      
      // Disciplinary notifications
      'disciplinary_action',
      'disciplinary_warning',
      'disciplinary_suspension',
      
      // Branch notifications
      'branch_added',
      'branch_updated',
      'branch_deleted',
      'branch_status_changed',
      
      // Expense notifications
      'expense_submitted',
      'expense_approved',
      'expense_rejected',
      'expense_paid',
      
      // Financial notifications
      'payment_received',
      'payment_processed',
      'payment_failed',
      'refund_processed',
      'fee_charged',
      'interest_accrued',
      
      // Loan Product notifications
      'loan_product_added',
      'loan_product_updated',
      'loan_product_deleted',
      'loan_product_activated',
      'loan_product_deactivated',
      
      // Chart of Accounts notifications
      'chart_of_accounts_added',
      'chart_of_accounts_updated',
      'chart_of_accounts_deleted',
      
      // General Ledger notifications
      'general_ledger_entry_added',
      'general_ledger_entry_updated',
      'general_ledger_entry_deleted',
      'trial_balance_generated',
      
      // Tax Management notifications
      'tax_configuration_added',
      'tax_configuration_updated',
      'tax_configuration_deleted',
      'tax_calculation_performed',
      
      // MFA notifications
      'mfa_enabled',
      'mfa_disabled',
      'mfa_verification_failed',
      'mfa_backup_codes_regenerated',
      
      // Compliance notifications
      'compliance_requirement_added',
      'compliance_requirement_updated',
      'compliance_requirement_deleted',
      'compliance_status_changed',
      'compliance_deadline_approaching',
      
      // Financial Statements notifications
      'financial_statement_created',
      'financial_statement_updated',
      'financial_statement_published',
      'financial_statement_generated',
      
      // System notifications
      'system_alert',
      'system_maintenance',
      'system_update',
      'backup_completed',
      'backup_failed',
      
      // General notifications
      'general',
      'reminder',
      'announcement',
      'alert'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Target users who should receive this notification
  targetRoles: {
    type: [String],
    enum: ['admin', 'manager', 'branch-manager', 'loan-officer', 'collections-officer', 'accountant', 'hr-officer', 'support', 'auditor', 'reporting'],
    default: ['admin'] // Default to admin only
  },
  // Specific users who should receive this notification (optional)
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Specific branches that should receive this notification (optional) - removed for savings management system
  // targetBranches: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Branch'
  // }],
  // Related entities
  relatedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  relatedLoan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Action data for clickable notifications
  actionUrl: {
    type: String,
    maxlength: 200
  },
  actionText: {
    type: String,
    maxlength: 50
  },
  // Read status tracking
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Dismissed status tracking
  dismissedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dismissedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Notification metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
inAppNotificationSchema.index({ targetRoles: 1, createdAt: -1 });
inAppNotificationSchema.index({ targetUsers: 1, createdAt: -1 });
// inAppNotificationSchema.index({ targetBranches: 1, createdAt: -1 }); // Removed for savings management system
inAppNotificationSchema.index({ type: 1, createdAt: -1 });
inAppNotificationSchema.index({ isActive: 1, createdAt: -1 });
inAppNotificationSchema.index({ priority: 1, createdAt: -1 });

// Compound indexes for complex queries
inAppNotificationSchema.index({ 
  isActive: 1, 
  targetRoles: 1, 
  createdAt: -1 
}, { name: 'active_role_created_desc' });

inAppNotificationSchema.index({ 
  isActive: 1, 
  targetUsers: 1, 
  createdAt: -1 
}, { name: 'active_user_created_desc' });

// inAppNotificationSchema.index({ 
//   isActive: 1, 
//   targetBranches: 1, 
//   createdAt: -1 
// }, { name: 'active_branch_created_desc' }); // Removed for savings management system

// Index for read status queries
inAppNotificationSchema.index({ 
  'readBy.user': 1, 
  isActive: 1, 
  createdAt: -1 
}, { name: 'read_user_active_created_desc' });

// Index for dismissed status queries
inAppNotificationSchema.index({ 
  'dismissedBy.user': 1, 
  isActive: 1, 
  createdAt: -1 
}, { name: 'dismissed_user_active_created_desc' });

// Index for unread count queries
inAppNotificationSchema.index({ 
  isActive: 1, 
  targetRoles: 1, 
  'readBy.user': 1, 
  'dismissedBy.user': 1 
}, { name: 'unread_count_optimization' });

// Virtual for checking if notification is expired
inAppNotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Method to mark as read by a user
inAppNotificationSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
  }
  return this.save();
};

// Method to check if user has read this notification
inAppNotificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to check if user has dismissed this notification
inAppNotificationSchema.methods.isDismissedBy = function(userId) {
  return this.dismissedBy && this.dismissedBy.some(dismiss => dismiss.user.toString() === userId.toString());
};

// Static method to create notification for all users
inAppNotificationSchema.statics.createForAllUsers = function(notificationData) {
  return this.create({
    ...notificationData,
    targetRoles: ['admin', 'manager', 'branch-manager', 'loan-officer', 'collections-officer', 'accountant', 'hr-officer', 'support', 'auditor', 'reporting']
  });
};

// Static method to create notification for specific roles
inAppNotificationSchema.statics.createForRoles = function(notificationData, roles) {
  return this.create({
    ...notificationData,
    targetRoles: roles
  });
};

export default mongoose.models.InAppNotification || mongoose.model('InAppNotification', inAppNotificationSchema);
