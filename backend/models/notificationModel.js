import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: [String],
    enum: ['email', 'sms'],
    required: true
  },
  purpose: {
    type: String,
    enum: [
      'loan_approved', 'loan_pending', 'loan_rejected', 'loan_completed', 'loan_disbursed', 'loan_restructured',
      'payment_reminder_7', 'payment_reminder_3', 'payment_overdue', 'recovery_warning', 'recovery_final',
      'visit_office', 'document_required', 'custom'
    ],
    default: 'custom'
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
