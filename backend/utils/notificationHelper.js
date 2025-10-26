import InAppNotification from '../models/inAppNotificationModel.js';

/**
 * Helper function to create in-app notifications
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (from enum)
 * @param {string} notificationData.priority - Priority level (low, medium, high, urgent)
 * @param {Array} notificationData.targetRoles - Target roles to receive notification
 * @param {Array} notificationData.targetUsers - Specific users to receive notification
 * @param {Array} notificationData.targetBranches - Specific branches to receive notification
 * @param {string} notificationData.relatedCustomer - Related customer ID
 * @param {string} notificationData.relatedLoan - Related loan ID
 * @param {string} notificationData.relatedUser - Related user ID
 * @param {string} notificationData.actionUrl - Action URL for clickable notification
 * @param {string} notificationData.actionText - Action text for clickable notification
 * @param {string} notificationData.createdBy - User ID who created the notification
 * @returns {Promise<Object|null>} Created notification or null if failed
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = new InAppNotification({
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority || 'medium',
      targetRoles: notificationData.targetRoles || ['admin'],
      targetUsers: notificationData.targetUsers || [],
      targetBranches: notificationData.targetBranches || [],
      relatedCustomer: notificationData.relatedCustomer,
      relatedLoan: notificationData.relatedLoan,
      relatedUser: notificationData.relatedUser,
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      createdBy: notificationData.createdBy
    });

    await notification.save();
    console.log(`✅ Notification created: ${notificationData.title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
};

/**
 * Create notification for customer operations
 */
export const createCustomerNotification = async (operation, customerData, user) => {
  const notifications = {
    added: {
      title: 'New Customer Added',
      message: `Customer "${customerData.personalInfo?.fullName || 'Unknown'}" has been added to the system`,
      type: 'customer_added',
      priority: 'medium',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/customers/${customerData._id}`,
      actionText: 'View Customer'
    },
    updated: {
      title: 'Customer Updated',
      message: `Customer "${customerData.personalInfo?.fullName || 'Unknown'}" information has been updated`,
      type: 'customer_updated',
      priority: 'low',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/customers/${customerData._id}`,
      actionText: 'View Customer'
    },
    deleted: {
      title: 'Customer Deleted',
      message: `Customer "${customerData.personalInfo?.fullName || 'Unknown'}" has been removed from the system`,
      type: 'customer_deleted',
      priority: 'high',
      targetRoles: ['admin', 'manager'],
      actionUrl: '/customers',
      actionText: 'View Customers'
    },
    statusChanged: {
      title: 'Customer Status Changed',
      message: `Customer "${customerData.personalInfo?.fullName || 'Unknown'}" status changed to ${customerData.status}`,
      type: 'customer_status_changed',
      priority: 'medium',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/customers/${customerData._id}`,
      actionText: 'View Customer'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      relatedCustomer: customerData._id,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for loan operations
 */
export const createLoanNotification = async (operation, loanData, user) => {
  const notifications = {
    added: {
      title: 'New Loan Application',
      message: `Loan application for ${loanData.amount} has been submitted`,
      type: 'loan_added',
      priority: 'high',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'Review Loan'
    },
    updated: {
      title: 'Loan Updated',
      message: `Loan ${loanData.loanNumber} has been updated`,
      type: 'loan_updated',
      priority: 'medium',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'View Loan'
    },
    deleted: {
      title: 'Loan Deleted',
      message: `Loan ${loanData.loanNumber} has been deleted`,
      type: 'loan_deleted',
      priority: 'high',
      targetRoles: ['admin', 'manager'],
      actionUrl: '/loans',
      actionText: 'View Loans'
    },
    approved: {
      title: 'Loan Approved',
      message: `Loan ${loanData.loanNumber} has been approved`,
      type: 'loan_approved',
      priority: 'high',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'View Loan'
    },
    rejected: {
      title: 'Loan Rejected',
      message: `Loan ${loanData.loanNumber} has been rejected`,
      type: 'loan_rejected',
      priority: 'high',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'View Loan'
    },
    disbursed: {
      title: 'Loan Disbursed',
      message: `Loan ${loanData.loanNumber} has been disbursed`,
      type: 'loan_disbursed',
      priority: 'high',
      targetRoles: ['admin', 'manager', 'loan-officer', 'accountant'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'View Loan'
    },
    overdue: {
      title: 'Loan Overdue',
      message: `Loan ${loanData.loanNumber} is overdue`,
      type: 'loan_overdue',
      priority: 'urgent',
      targetRoles: ['admin', 'manager', 'collections-officer'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'View Loan'
    },
    completed: {
      title: 'Loan Completed',
      message: `Loan ${loanData.loanCode || loanData.loanNumber} has been completed successfully`,
      type: 'loan_completed',
      priority: 'high',
      targetRoles: ['admin', 'manager', 'loan-officer', 'accountant'],
      actionUrl: `/loans/${loanData._id}`,
      actionText: 'View Loan'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      relatedLoan: loanData._id,
      relatedCustomer: loanData.customer,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for user operations
 */
export const createUserNotification = async (operation, userData, createdBy) => {
  const notifications = {
    added: {
      title: 'New User Added',
      message: `User "${userData.fullName}" has been added to the system`,
      type: 'user_added',
      priority: 'high',
      targetRoles: ['admin'],
      actionUrl: `/users/${userData._id}`,
      actionText: 'View User'
    },
    updated: {
      title: 'User Updated',
      message: `User "${userData.fullName}" information has been updated`,
      type: 'user_updated',
      priority: 'medium',
      targetRoles: ['admin'],
      actionUrl: `/users/${userData._id}`,
      actionText: 'View User'
    },
    deleted: {
      title: 'User Deleted',
      message: `User "${userData.fullName}" has been removed from the system`,
      type: 'user_deleted',
      priority: 'high',
      targetRoles: ['admin'],
      actionUrl: '/users',
      actionText: 'View Users'
    },
    statusChanged: {
      title: 'User Status Changed',
      message: `User "${userData.fullName}" status changed to ${userData.status}`,
      type: 'user_status_changed',
      priority: 'high',
      targetRoles: ['admin'],
      actionUrl: `/users/${userData._id}`,
      actionText: 'View User'
    },
    roleChanged: {
      title: 'User Role Changed',
      message: `User "${userData.fullName}" role changed to ${userData.role}`,
      type: 'user_role_changed',
      priority: 'high',
      targetRoles: ['admin'],
      actionUrl: `/users/${userData._id}`,
      actionText: 'View User'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      relatedUser: userData._id,
      createdBy: createdBy._id
    });
  }
  return null;
};

/**
 * Create notification for employee operations
 */
export const createEmployeeNotification = async (operation, employeeData, user) => {
  const notifications = {
    added: {
      title: 'New Employee Added',
      message: `Employee "${employeeData.user?.fullName || 'Unknown'}" has been added to the system`,
      type: 'employee_added',
      priority: 'medium',
      targetRoles: ['admin', 'hr-officer'],
      actionUrl: `/employees/${employeeData._id}`,
      actionText: 'View Employee'
    },
    updated: {
      title: 'Employee Updated',
      message: `Employee "${employeeData.user?.fullName || 'Unknown'}" information has been updated`,
      type: 'employee_updated',
      priority: 'low',
      targetRoles: ['admin', 'hr-officer'],
      actionUrl: `/employees/${employeeData._id}`,
      actionText: 'View Employee'
    },
    deleted: {
      title: 'Employee Deleted',
      message: `Employee "${employeeData.user?.fullName || 'Unknown'}" has been removed from the system`,
      type: 'employee_deleted',
      priority: 'high',
      targetRoles: ['admin', 'hr-officer'],
      actionUrl: '/employees',
      actionText: 'View Employees'
    },
    statusChanged: {
      title: 'Employee Status Changed',
      message: `Employee "${employeeData.user?.fullName || 'Unknown'}" status changed to ${employeeData.status}`,
      type: 'employee_status_changed',
      priority: 'medium',
      targetRoles: ['admin', 'hr-officer'],
      actionUrl: `/employees/${employeeData._id}`,
      actionText: 'View Employee'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      relatedUser: employeeData._id,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for loan product operations
 */
export const createLoanProductNotification = async (operation, productData, user) => {
  const notifications = {
    added: {
      title: 'New Loan Product Added',
      message: `Loan product "${productData.name}" has been added to the system`,
      type: 'loan_product_added',
      priority: 'medium',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/loan-products/${productData._id}`,
      actionText: 'View Product'
    },
    updated: {
      title: 'Loan Product Updated',
      message: `Loan product "${productData.name}" has been updated`,
      type: 'loan_product_updated',
      priority: 'medium',
      targetRoles: ['admin', 'manager', 'loan-officer'],
      actionUrl: `/loan-products/${productData._id}`,
      actionText: 'View Product'
    },
    deleted: {
      title: 'Loan Product Deleted',
      message: `Loan product "${productData.name}" has been removed from the system`,
      type: 'loan_product_deleted',
      priority: 'high',
      targetRoles: ['admin', 'manager'],
      actionUrl: '/loan-products',
      actionText: 'View Products'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for chart of accounts operations
 */
export const createChartOfAccountsNotification = async (operation, accountData, user) => {
  const notifications = {
    added: {
      title: 'New Chart of Accounts Entry',
      message: `Account "${accountData.accountName}" (${accountData.accountCode}) has been added`,
      type: 'chart_of_accounts_added',
      priority: 'medium',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/chart-of-accounts/${accountData._id}`,
      actionText: 'View Account'
    },
    updated: {
      title: 'Chart of Accounts Updated',
      message: `Account "${accountData.accountName}" (${accountData.accountCode}) has been updated`,
      type: 'chart_of_accounts_updated',
      priority: 'low',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/chart-of-accounts/${accountData._id}`,
      actionText: 'View Account'
    },
    deleted: {
      title: 'Chart of Accounts Entry Deleted',
      message: `Account "${accountData.accountName}" (${accountData.accountCode}) has been deleted`,
      type: 'chart_of_accounts_deleted',
      priority: 'high',
      targetRoles: ['admin', 'finance-manager'],
      actionUrl: '/chart-of-accounts',
      actionText: 'View Accounts'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for general ledger operations
 */
export const createGeneralLedgerNotification = async (operation, entryData, user) => {
  const notifications = {
    added: {
      title: 'New General Ledger Entry',
      message: `GL entry for ${entryData.reference} has been created`,
      type: 'general_ledger_entry_added',
      priority: 'medium',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/general-ledger/${entryData._id}`,
      actionText: 'View Entry'
    },
    updated: {
      title: 'General Ledger Entry Updated',
      message: `GL entry for ${entryData.reference} has been updated`,
      type: 'general_ledger_entry_updated',
      priority: 'low',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/general-ledger/${entryData._id}`,
      actionText: 'View Entry'
    },
    deleted: {
      title: 'General Ledger Entry Deleted',
      message: `GL entry for ${entryData.reference} has been deleted`,
      type: 'general_ledger_entry_deleted',
      priority: 'high',
      targetRoles: ['admin', 'finance-manager'],
      actionUrl: '/general-ledger',
      actionText: 'View Entries'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for tax management operations
 */
export const createTaxManagementNotification = async (operation, taxData, user) => {
  const notifications = {
    added: {
      title: 'New Tax Configuration',
      message: `Tax "${taxData.taxName}" (${taxData.taxCode}) has been added`,
      type: 'tax_configuration_added',
      priority: 'medium',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/tax-management/${taxData._id}`,
      actionText: 'View Tax'
    },
    updated: {
      title: 'Tax Configuration Updated',
      message: `Tax "${taxData.taxName}" (${taxData.taxCode}) has been updated`,
      type: 'tax_configuration_updated',
      priority: 'low',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/tax-management/${taxData._id}`,
      actionText: 'View Tax'
    },
    deleted: {
      title: 'Tax Configuration Deleted',
      message: `Tax "${taxData.taxName}" (${taxData.taxCode}) has been deleted`,
      type: 'tax_configuration_deleted',
      priority: 'high',
      targetRoles: ['admin', 'finance-manager'],
      actionUrl: '/tax-management',
      actionText: 'View Taxes'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for MFA operations
 */
export const createMFANotification = async (operation, mfaData, user) => {
  const notifications = {
    enabled: {
      title: 'MFA Enabled',
      message: `Multi-factor authentication has been enabled for user`,
      type: 'mfa_enabled',
      priority: 'medium',
      targetRoles: ['admin', 'manager'],
      actionUrl: `/mfa/user/${mfaData.user}`,
      actionText: 'View MFA'
    },
    disabled: {
      title: 'MFA Disabled',
      message: `Multi-factor authentication has been disabled for user`,
      type: 'mfa_disabled',
      priority: 'high',
      targetRoles: ['admin', 'manager'],
      actionUrl: `/mfa/user/${mfaData.user}`,
      actionText: 'View MFA'
    },
    verificationFailed: {
      title: 'MFA Verification Failed',
      message: `Multiple failed MFA attempts detected`,
      type: 'mfa_verification_failed',
      priority: 'urgent',
      targetRoles: ['admin', 'manager'],
      actionUrl: `/mfa/user/${mfaData.user}`,
      actionText: 'View MFA'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      relatedUser: mfaData.user,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for compliance operations
 */
export const createComplianceNotification = async (operation, complianceData, user) => {
  const notifications = {
    added: {
      title: 'New Compliance Requirement',
      message: `Compliance requirement "${complianceData.title}" has been added`,
      type: 'compliance_requirement_added',
      priority: 'high',
      targetRoles: ['admin', 'compliance-officer'],
      actionUrl: `/compliance/${complianceData._id}`,
      actionText: 'View Requirement'
    },
    updated: {
      title: 'Compliance Requirement Updated',
      message: `Compliance requirement "${complianceData.title}" has been updated`,
      type: 'compliance_requirement_updated',
      priority: 'medium',
      targetRoles: ['admin', 'compliance-officer'],
      actionUrl: `/compliance/${complianceData._id}`,
      actionText: 'View Requirement'
    },
    deleted: {
      title: 'Compliance Requirement Deleted',
      message: `Compliance requirement "${complianceData.title}" has been deleted`,
      type: 'compliance_requirement_deleted',
      priority: 'high',
      targetRoles: ['admin', 'compliance-officer'],
      actionUrl: '/compliance',
      actionText: 'View Requirements'
    },
    statusChanged: {
      title: 'Compliance Status Changed',
      message: `Compliance requirement "${complianceData.title}" status changed to ${complianceData.status}`,
      type: 'compliance_status_changed',
      priority: 'medium',
      targetRoles: ['admin', 'compliance-officer'],
      actionUrl: `/compliance/${complianceData._id}`,
      actionText: 'View Requirement'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create notification for financial statements operations
 */
export const createFinancialStatementNotification = async (operation, statementData, user) => {
  const notifications = {
    created: {
      title: 'Financial Statement Created',
      message: `Financial statement "${statementData.title}" has been created`,
      type: 'financial_statement_created',
      priority: 'medium',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/financial-statements/${statementData._id}`,
      actionText: 'View Statement'
    },
    updated: {
      title: 'Financial Statement Updated',
      message: `Financial statement "${statementData.title}" has been updated`,
      type: 'financial_statement_updated',
      priority: 'low',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/financial-statements/${statementData._id}`,
      actionText: 'View Statement'
    },
    published: {
      title: 'Financial Statement Published',
      message: `Financial statement "${statementData.title}" has been published`,
      type: 'financial_statement_published',
      priority: 'high',
      targetRoles: ['admin', 'finance-manager', 'accountant', 'auditor'],
      actionUrl: `/financial-statements/${statementData._id}`,
      actionText: 'View Statement'
    },
    generated: {
      title: 'Financial Statement Generated',
      message: `Financial statement "${statementData.title}" has been generated`,
      type: 'financial_statement_generated',
      priority: 'medium',
      targetRoles: ['admin', 'finance-manager', 'accountant'],
      actionUrl: `/financial-statements/${statementData._id}`,
      actionText: 'View Statement'
    }
  };

  const notificationData = notifications[operation];
  if (notificationData) {
    return await createNotification({
      ...notificationData,
      createdBy: user._id
    });
  }
  return null;
};

/**
 * Create system notification
 */
export const createSystemNotification = async (title, message, type = 'system_alert', priority = 'medium', targetRoles = ['admin']) => {
  return await createNotification({
    title,
    message,
    type,
    priority,
    targetRoles,
    actionUrl: '/notifications',
    actionText: 'View Notifications'
  });
};

/**
 * Create reminder notification
 */
export const createReminderNotification = async (title, message, targetRoles = ['admin'], targetUsers = []) => {
  return await createNotification({
    title,
    message,
    type: 'reminder',
    priority: 'medium',
    targetRoles,
    targetUsers,
    actionUrl: '/notifications',
    actionText: 'View Notifications'
  });
};
