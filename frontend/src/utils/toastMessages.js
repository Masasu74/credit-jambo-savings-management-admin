/**
 * Centralized Toast Messages Utility
 * 
 * Provides consistent, user-friendly toast messages throughout the application
 * All messages follow best practices:
 * - Clear and concise
 * - Actionable when possible
 * - Professional tone
 * - Specific to the action
 */

export const ToastMessages = {
  // ==================== AUTHENTICATION ====================
  auth: {
    loginSuccess: (name) => `Welcome back, ${name}! 🎉`,
    loginError: 'Unable to sign in. Please check your email and password.',
    logoutSuccess: 'You have been successfully logged out. See you soon! 👋',
    sessionExpired: 'Your session has expired. Please sign in again to continue.',
    invalidCredentials: 'Invalid email or password. Please try again.',
    accountDisabled: 'Your account has been disabled. Please contact your administrator.',
    twoFactorRequired: 'Two-factor authentication required. Please check your device.',
    passwordChanged: 'Password changed successfully! Please sign in with your new password.',
    inactivityWarning: 'You will be logged out due to inactivity in 5 minutes.',
    inactivityLogout: 'You have been logged out due to inactivity. Please sign in again.',
  },

  // ==================== CUSTOMER ====================
  customer: {
    createSuccess: 'Customer created successfully! ✅',
    createError: 'Failed to create customer. Please check all required fields and try again.',
    updateSuccess: 'Customer information updated successfully! ✅',
    updateError: 'Failed to update customer. Please try again.',
    deleteSuccess: 'Customer deleted successfully.',
    deleteError: 'Failed to delete customer. This customer may have active loans.',
    fetchError: 'Unable to load customer data. Please refresh the page.',
    notFound: 'Customer not found. They may have been removed.',
    duplicateEmail: 'This email address is already registered. Please use a different email.',
    duplicateId: 'This ID number is already registered in the system.',
    registrationSuccess: 'Registration successful! Welcome to your portal. 🎉',
    registrationError: 'Registration failed. Please check your information and try again.',
  },

  // ==================== LOAN ====================
  loan: {
    createSuccess: 'Loan created successfully! 🎉',
    createError: 'Failed to create loan. Please verify all information and try again.',
    updateSuccess: 'Loan updated successfully! ✅',
    updateError: 'Failed to update loan. Please try again.',
    deleteSuccess: 'Loan deleted successfully.',
    deleteError: 'Failed to delete loan. Active loans cannot be deleted.',
    approveSuccess: 'Loan approved successfully! The customer will be notified. ✅',
    approveError: 'Failed to approve loan. Please try again.',
    rejectSuccess: 'Loan rejected. The customer will be notified.',
    rejectError: 'Failed to reject loan. Please try again.',
    disburseSuccess: 'Loan disbursed successfully! Repayment schedule generated. 🎉',
    disburseError: 'Failed to disburse loan. Please check the disbursement details.',
    fetchError: 'Unable to load loan data. Please refresh the page.',
    notFound: 'Loan not found. It may have been removed.',
    statusUpdateSuccess: 'Loan status updated successfully! ✅',
    statusUpdateError: 'Failed to update loan status. Please try again.',
    completeSuccess: 'Loan marked as completed! 🎉',
    completeError: 'Failed to complete loan. Outstanding balance must be zero.',
    restructureSuccess: 'Loan restructured successfully! New schedule generated. ✅',
    restructureError: 'Failed to restructure loan. Please check the details.',
    writeOffSuccess: 'Loan written off successfully.',
    writeOffError: 'Failed to write off loan. Please try again.',
  },

  // ==================== APPLICATION ====================
  application: {
    submitSuccess: 'Application submitted successfully! You will be notified of the decision. 🎉',
    submitError: 'Failed to submit application. Please check all required fields.',
    updateSuccess: 'Application updated successfully! ✅',
    updateError: 'Failed to update application. Please try again.',
    deleteSuccess: 'Application deleted successfully.',
    deleteError: 'Failed to delete application. Please try again.',
    fetchError: 'Unable to load applications. Please refresh the page.',
    notFound: 'Application not found. It may have been removed.',
    documentUploadSuccess: 'Documents uploaded successfully! ✅',
    documentUploadError: 'Failed to upload documents. Please check file size and format.',
  },

  // ==================== PAYMENT ====================
  payment: {
    recordSuccess: 'Payment recorded successfully! Balance updated. ✅',
    recordError: 'Failed to record payment. Please verify the payment details.',
    reverseSuccess: 'Payment reversed successfully.',
    reverseError: 'Failed to reverse payment. Please contact support.',
    fetchError: 'Unable to load payment history. Please refresh the page.',
    insufficientAmount: 'Payment amount is insufficient. Please check the amount due.',
    invalidAmount: 'Invalid payment amount. Please enter a valid amount.',
    penaltyApplied: 'Late payment penalty applied to this payment.',
    overpayment: 'Payment amount exceeds balance. Excess will be applied to next payment.',
  },

  // ==================== BRANCH ====================
  branch: {
    createSuccess: 'Branch created successfully! ✅',
    createError: 'Failed to create branch. Please check all required fields.',
    updateSuccess: 'Branch updated successfully! ✅',
    updateError: 'Failed to update branch. Please try again.',
    deleteSuccess: 'Branch deleted successfully.',
    deleteError: 'Failed to delete branch. This branch may have active customers or loans.',
    fetchError: 'Unable to load branch data. Please refresh the page.',
    notFound: 'Branch not found. It may have been removed.',
  },

  // ==================== USER ====================
  user: {
    createSuccess: 'User created successfully! Login credentials sent. ✅',
    createError: 'Failed to create user. Please check all required fields.',
    updateSuccess: 'User updated successfully! ✅',
    updateError: 'Failed to update user. Please try again.',
    deleteSuccess: 'User deleted successfully.',
    deleteError: 'Failed to delete user. Please try again.',
    fetchError: 'Unable to load user data. Please refresh the page.',
    notFound: 'User not found. They may have been removed.',
    profileUpdateSuccess: 'Profile updated successfully! ✅',
    profileUpdateError: 'Failed to update profile. Please try again.',
    passwordUpdateSuccess: 'Password updated successfully! ✅',
    passwordUpdateError: 'Failed to update password. Please try again.',
  },

  // ==================== NOTIFICATION ====================
  notification: {
    sendSuccess: 'Notification sent successfully! 📧',
    sendError: 'Failed to send notification. Please try again.',
    deleteSuccess: 'Notification deleted successfully.',
    deleteError: 'Failed to delete notification. Please try again.',
    markReadSuccess: 'Notification marked as read.',
    markReadError: 'Failed to mark notification as read.',
    fetchError: 'Unable to load notifications. Please refresh the page.',
  },

  // ==================== EXPENSE ====================
  expense: {
    createSuccess: 'Expense recorded successfully! ✅',
    createError: 'Failed to record expense. Please check all required fields.',
    updateSuccess: 'Expense updated successfully! ✅',
    updateError: 'Failed to update expense. Please try again.',
    deleteSuccess: 'Expense deleted successfully.',
    deleteError: 'Failed to delete expense. Please try again.',
    fetchError: 'Unable to load expenses. Please refresh the page.',
    notFound: 'Expense not found. It may have been removed.',
    approveSuccess: 'Expense approved successfully! ✅',
    approveError: 'Failed to approve expense. Please try again.',
  },

  // ==================== ATTENDANCE ====================
  attendance: {
    clockInSuccess: 'Clocked in successfully! Have a great day! 🌅',
    clockInError: 'Failed to clock in. Please try again.',
    clockOutSuccess: 'Clocked out successfully! See you tomorrow! 🌙',
    clockOutError: 'Failed to clock out. Please try again.',
    updateSuccess: 'Attendance updated successfully! ✅',
    updateError: 'Failed to update attendance. Please try again.',
    fetchError: 'Unable to load attendance records. Please refresh the page.',
    alreadyClockedIn: 'You are already clocked in for today.',
    notClockedIn: 'You need to clock in first before clocking out.',
  },

  // ==================== LEAVE ====================
  leave: {
    requestSuccess: 'Leave request submitted successfully! You will be notified of the decision. 📝',
    requestError: 'Failed to submit leave request. Please try again.',
    approveSuccess: 'Leave request approved successfully! Employee notified. ✅',
    approveError: 'Failed to approve leave request. Please try again.',
    rejectSuccess: 'Leave request rejected. Employee notified.',
    rejectError: 'Failed to reject leave request. Please try again.',
    cancelSuccess: 'Leave request cancelled successfully.',
    cancelError: 'Failed to cancel leave request. Please try again.',
    fetchError: 'Unable to load leave requests. Please refresh the page.',
    insufficientBalance: 'Insufficient leave balance. You have {balance} days available.',
    overlappingDates: 'Leave dates overlap with an existing request.',
  },

  // ==================== EMPLOYEE ====================
  employee: {
    createSuccess: 'Employee added successfully! ✅',
    createError: 'Failed to add employee. Please check all required fields.',
    updateSuccess: 'Employee updated successfully! ✅',
    updateError: 'Failed to update employee. Please try again.',
    deleteSuccess: 'Employee removed successfully.',
    deleteError: 'Failed to remove employee. Please try again.',
    fetchError: 'Unable to load employee data. Please refresh the page.',
    notFound: 'Employee not found. They may have been removed.',
  },

  // ==================== FINANCIAL ====================
  financial: {
    saveSuccess: 'Financial data saved successfully! ✅',
    saveError: 'Failed to save financial data. Please try again.',
    deleteSuccess: 'Financial record deleted successfully.',
    deleteError: 'Failed to delete financial record. Please try again.',
    fetchError: 'Unable to load financial data. Please refresh the page.',
    reportGenerateSuccess: 'Report generated successfully! 📊',
    reportGenerateError: 'Failed to generate report. Please try again.',
    exportSuccess: 'Data exported successfully! 📥',
    exportError: 'Failed to export data. Please try again.',
    reconcileSuccess: 'Account reconciled successfully! ✅',
    reconcileError: 'Failed to reconcile account. Please check the entries.',
  },

  // ==================== GENERIC ====================
  generic: {
    saveSuccess: 'Changes saved successfully! ✅',
    saveError: 'Failed to save changes. Please try again.',
    deleteSuccess: 'Deleted successfully.',
    deleteError: 'Failed to delete. Please try again.',
    updateSuccess: 'Updated successfully! ✅',
    updateError: 'Failed to update. Please try again.',
    fetchError: 'Unable to load data. Please refresh the page and try again.',
    networkError: 'Network error. Please check your internet connection.',
    serverError: 'Server error. Please try again later or contact support.',
    validationError: 'Please fill in all required fields correctly.',
    permissionDenied: 'You don\'t have permission to perform this action. Contact your administrator.',
    notFound: 'The requested item was not found.',
    loading: 'Loading...',
    processing: 'Processing...',
    success: 'Operation completed successfully! ✅',
    error: 'An error occurred. Please try again.',
    confirmAction: 'Are you sure you want to proceed?',
    unsavedChanges: 'You have unsaved changes. Do you want to leave?',
    fileUploadSuccess: 'File uploaded successfully! ✅',
    fileUploadError: 'Failed to upload file. Please check the file size and format.',
    fileTooLarge: 'File is too large. Maximum size is {maxSize}MB.',
    invalidFileType: 'Invalid file type. Allowed types: {types}',
    copySuccess: 'Copied to clipboard! ✅',
    copyError: 'Failed to copy to clipboard.',
  },

  // ==================== VALIDATION ====================
  validation: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    minLength: (field, min) => `${field} must be at least ${min} characters.`,
    maxLength: (field, max) => `${field} must not exceed ${max} characters.`,
    minValue: (field, min) => `${field} must be at least ${min}.`,
    maxValue: (field, max) => `${field} must not exceed ${max}.`,
    pattern: (field) => `Please enter a valid ${field}.`,
    passwordMismatch: 'Passwords do not match.',
    passwordWeak: 'Password is too weak. Use at least 8 characters with letters and numbers.',
    invalidDate: 'Please enter a valid date.',
    futureDate: 'Date cannot be in the future.',
    pastDate: 'Date cannot be in the past.',
    invalidAmount: 'Please enter a valid amount.',
    negativeAmount: 'Amount cannot be negative.',
  },
};

/**
 * Helper function to format messages with dynamic values
 * @param {string} message - Message template with {placeholders}
 * @param {object} values - Object with placeholder values
 * @returns {string} Formatted message
 */
export const formatMessage = (message, values = {}) => {
  let formatted = message;
  Object.keys(values).forEach(key => {
    formatted = formatted.replace(`{${key}}`, values[key]);
  });
  return formatted;
};

/**
 * Helper function to get error message from API response
 * @param {object} error - Axios error object
 * @param {string} defaultMessage - Default message if none found
 * @returns {string} Error message
 */
export const getErrorMessage = (error, defaultMessage = ToastMessages.generic.error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * Helper function to show success toast
 * @param {function} toast - Toast function
 * @param {string} message - Message to show
 */
export const showSuccess = (toast, message) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Helper function to show error toast
 * @param {function} toast - Toast function
 * @param {string} message - Message to show
 */
export const showError = (toast, message) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Helper function to show warning toast
 * @param {function} toast - Toast function
 * @param {string} message - Message to show
 */
export const showWarning = (toast, message) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Helper function to show info toast
 * @param {function} toast - Toast function
 * @param {string} message - Message to show
 */
export const showInfo = (toast, message) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export default ToastMessages;

