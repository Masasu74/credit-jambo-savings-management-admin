import { toast } from 'react-toastify';

/**
 * Handle permission errors with specific action context
 * @param {Error} error - The error object from API call
 * @param {string} action - The action being performed (e.g., "create loans", "delete customers")
 * @param {Object} options - Additional options
 * @param {boolean} options.redirectOnAuth - Whether to redirect on 401 (default: true)
 * @param {string} options.redirectPath - Path to redirect to on 401 (default: "/login")
 * @returns {Object} - Result object with success and message
 */
export const handlePermissionError = (error, action = "perform this action", options = {}) => {
  const {
    redirectOnAuth = true,
    redirectPath = "/login"
  } = options;
  
  const status = error.response?.status;
  const message = error.response?.data?.message || "An error occurred";
  
  switch (status) {
    case 401:
      toast.error("Session expired. Please log in again.");
      if (redirectOnAuth) {
        localStorage.removeItem("token");
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 2000);
      }
      break;
    case 403:
      toast.error(`Access denied: You don't have permission to ${action}. Please contact your administrator.`);
      break;
    case 404:
      toast.error("Resource not found. It may have been deleted or moved.");
      break;
    case 422:
      toast.error("Invalid data provided. Please check your input and try again.");
      break;
    case 429:
      toast.error("Too many requests. Please wait a moment and try again.");
      break;
    case 500:
      toast.error("Server error. Please try again later or contact support.");
      break;
    default:
      toast.error(message || "An unexpected error occurred");
  }
  
  return { success: false, message };
};

/**
 * Check if user has required role for an action
 * @param {Object} user - User object with role property
 * @param {string|Array} requiredRoles - Required role(s) for the action
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (user, requiredRoles) => {
  if (!user || !user.role) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  
  return user.role === requiredRoles;
};

/**
 * Get user-friendly role names
 * @param {string} role - Role identifier
 * @returns {string} - User-friendly role name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'branch-manager': 'Branch Manager',
    'hr-officer': 'HR Officer',
    'loan-officer': 'Loan Officer',
    'collections-officer': 'Collections Officer',
    'accountant': 'Accountant',
    'reporting': 'Reporting Officer',
    'support': 'Support Staff',
    'auditor': 'Auditor',
    'user': 'User'
  };
  
  return roleNames[role] || role;
};

/**
 * Get permission requirements for common actions
 * @param {string} action - The action being performed
 * @returns {Object} - Permission requirements
 */
export const getPermissionRequirements = (action) => {
  const requirements = {
    'create-loans': {
      roles: ['support', 'collections-officer', 'loan-officer', 'branch-manager', 'manager', 'admin'],
      description: 'Create new loans'
    },
    'update-loans': {
      roles: ['loan-officer', 'branch-manager', 'manager', 'admin'],
      description: 'Update loan information'
    },
    'delete-loans': {
      roles: ['manager', 'admin'],
      description: 'Delete loans'
    },
    'approve-loans': {
      roles: ['collections-officer', 'loan-officer', 'manager', 'admin'],
      description: 'Approve or reject loans'
    },
    'create-customers': {
      roles: ['support', 'loan-officer', 'branch-manager', 'manager', 'admin'],
      description: 'Create new customers'
    },
    'update-customers': {
      roles: ['loan-officer', 'branch-manager', 'manager', 'admin'],
      description: 'Update customer information'
    },
    'delete-customers': {
      roles: ['manager', 'admin'],
      description: 'Delete customers'
    },
    'manage-branches': {
      roles: ['manager', 'admin'],
      description: 'Manage branches'
    },
    'manage-users': {
      roles: ['manager', 'admin'],
      description: 'Manage user accounts'
    },
    'view-reports': {
      roles: ['reporting', 'accountant', 'manager', 'admin'],
      description: 'View financial reports'
    },
    'manage-expenses': {
      roles: ['accountant', 'manager', 'admin'],
      description: 'Manage expenses'
    },
    'manage-hr': {
      roles: ['hr-officer', 'manager', 'admin'],
      description: 'Manage HR functions'
    },
    'manage-loan-recovery-reports': {
      roles: ['loan-officer', 'branch-manager', 'manager', 'admin'],
      description: 'Manage loan recovery reports'
    }
  };
  
  return requirements[action] || {
    roles: ['admin'],
    description: 'Perform this action'
  };
};

export default handlePermissionError;
