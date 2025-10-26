import React from 'react';
import { useAppContext } from '../context/AppContext';
import { hasPermission, getPermissionRequirements, getRoleDisplayName } from '../utils/permissionErrorHandler';
import { FaLock, FaExclamationTriangle } from 'react-icons/fa';

/**
 * PermissionGuard component that conditionally renders content based on user permissions
 * @param {Object} props - Component props
 * @param {string|Array} props.requiredRoles - Required role(s) for the action
 * @param {string} props.action - The action being performed (for error messages)
 * @param {React.ReactNode} props.children - Content to render if user has permission
 * @param {React.ReactNode} props.fallback - Fallback content to show if no permission
 * @param {boolean} props.showMessage - Whether to show permission message
 * @param {string} props.messageType - Type of message to show ('error', 'warning', 'info')
 */
const PermissionGuard = ({
  requiredRoles,
  action = "perform this action",
  children,
  fallback = null,
  showMessage = true,
  messageType = 'error'
}) => {
  const { user } = useAppContext();
  
  const hasAccess = hasPermission(user, requiredRoles);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showMessage) {
    return null;
  }
  
  const requirements = getPermissionRequirements(action);
  const userRole = user?.role ? getRoleDisplayName(user.role) : 'Guest';
  
  const getMessageContent = () => {
    const requiredRoleNames = requirements.roles.map(getRoleDisplayName).join(', ');
    
    return (
      <div className={`p-4 rounded-lg border ${
        messageType === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' :
        messageType === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300' :
        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
      }`}>
        <div className="flex items-start space-x-3">
          {messageType === 'error' ? (
            <FaLock className="flex-shrink-0 mt-1 text-red-600" />
          ) : (
            <FaExclamationTriangle className="flex-shrink-0 mt-1 text-yellow-600" />
          )}
          <div className="flex-1">
            <h4 className="font-medium mb-1">
              Access Restricted
            </h4>
            <p className="text-sm mb-2">
              You don't have permission to {requirements.description || action}.
            </p>
            <div className="text-xs space-y-1">
              <p><strong>Your role:</strong> {userRole}</p>
              <p><strong>Required roles:</strong> {requiredRoleNames}</p>
              <p className="mt-2">
                Please contact your administrator if you believe you should have access to this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return getMessageContent();
};

/**
 * Hook to check if user has permission for an action
 * @param {string|Array} requiredRoles - Required role(s) for the action
 * @returns {boolean} - Whether user has permission
 */
export const usePermission = (requiredRoles) => {
  const { user } = useAppContext();
  return hasPermission(user, requiredRoles);
};

/**
 * Hook to get permission requirements for an action
 * @param {string} action - The action being performed
 * @returns {Object} - Permission requirements
 */
export const usePermissionRequirements = (action) => {
  return getPermissionRequirements(action);
};

export default PermissionGuard;
