import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMoneyBill, 
  FaCheck, 
  FaExclamationTriangle, 
  FaUser, 
  FaFileAlt,
  FaChartBar,
  FaUsers,
  FaList
} from 'react-icons/fa';
import { useSystemColors } from '../../hooks/useSystemColors';
import { usePermission } from '../PermissionGuard';

const QuickActionsPanel = () => {
  const navigate = useNavigate();
  const { colors } = useSystemColors();
  const canManageLoans = usePermission(['admin', 'manager', 'loan-officer']);
  const canManageCustomers = usePermission(['admin', 'manager', 'loan-officer']);
  const canViewReports = usePermission(['admin', 'manager', 'branch-manager', 'reporting']);

  // Fallback colors
  const fallbackColors = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  const quickActions = [
    // Customer Management
    {
      id: 'add-customer',
      title: 'Add Customer',
      icon: <FaUser size={20} />,
      color: 'purple',
      onClick: () => navigate('/addcustomer'),
      permission: canManageCustomers,
      description: 'Register new customers to the system'
    },
    {
      id: 'view-customers',
      title: 'View Customers',
      icon: <FaUsers size={20} />,
      color: 'pink',
      onClick: () => navigate('/customers'),
      permission: canManageCustomers,
      description: 'View and manage all customers'
    },
    // Loan Management
    {
      id: 'add-loan',
      title: 'Add Loan',
      icon: <FaFileAlt size={20} />,
      color: 'teal',
      onClick: () => navigate('/addloan'),
      permission: canManageLoans,
      description: 'Create new loan applications'
    },
    {
      id: 'view-loans',
      title: 'View Loans',
      icon: <FaList size={20} />,
      color: 'indigo',
      onClick: () => navigate('/loanslist'),
      permission: canManageLoans,
      description: 'View and manage all loans'
    },
    {
      id: 'approve-loan',
      title: 'Approve Loan',
      icon: <FaCheck size={20} />,
      color: 'green',
      onClick: () => navigate('/loanslist'),
      permission: canManageLoans,
      description: 'Review and approve pending loan applications'
    },
    {
      id: 'disburse-loan',
      title: 'Disburse Loan',
      icon: <FaMoneyBill size={20} />,
      color: 'blue',
      onClick: () => navigate('/approvedloans'),
      permission: canManageLoans,
      description: 'Disburse approved loans to customers'
    },
    {
      id: 'handle-overdue',
      title: 'Handle Overdue',
      icon: <FaExclamationTriangle size={20} />,
      color: 'yellow',
      onClick: () => navigate('/overdueloans'),
      permission: canManageLoans,
      description: 'Manage overdue loans and collections'
    },
    // Reports
    {
      id: 'view-reports',
      title: 'View Reports',
      icon: <FaChartBar size={20} />,
      color: 'gray',
      onClick: () => navigate('/reports/all-loans'),
      permission: canViewReports,
      description: 'Access comprehensive business reports'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      green: 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700',
      pink: 'bg-pink-50 hover:bg-pink-100 text-pink-600 border-pink-200 dark:bg-pink-900/20 dark:hover:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700',
      gray: 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600',
      teal: 'bg-teal-50 hover:bg-teal-100 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700'
    };
    return colorMap[color] || colorMap.blue;
  };

  const filteredActions = quickActions.filter(action => action.permission);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {filteredActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`p-2 rounded-md border transition-all duration-200 hover:scale-105 hover:shadow-sm group ${getColorClasses(action.color)}`}
            title={action.description}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-1 rounded-md bg-white dark:bg-gray-700 shadow-sm group-hover:shadow-md transition-shadow">
                {React.cloneElement(action.icon, { size: 14 })}
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {action.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">🔒</div>
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Actions Available</h4>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to perform any quick actions at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickActionsPanel;
