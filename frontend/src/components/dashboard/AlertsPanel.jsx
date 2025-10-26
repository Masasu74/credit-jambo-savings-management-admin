import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaTimes,
  FaEye,
  FaClock,
  FaMoneyBill,
  FaUser
} from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { useSystemColors } from '../../hooks/useSystemColors';

const AlertsPanel = () => {
  const navigate = useNavigate();
  const { loans = [], customers = [], api } = useAppContext();
  const { colors } = useSystemColors();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    generateAlerts();
  }, [loans, customers]);

  const generateAlerts = () => {
    setLoading(true);
    
    const newAlerts = [];

    // Overdue loans alert
    const overdueLoans = loans.filter(loan => loan.status === 'overdue');
    if (overdueLoans.length > 0) {
      newAlerts.push({
        id: 'overdue-loans',
        type: 'error',
        title: 'Overdue Payments',
        message: `${overdueLoans.length} loan${overdueLoans.length > 1 ? 's' : ''} require immediate attention`,
        count: overdueLoans.length,
        priority: 'high',
        action: () => navigate('/overdueloans'),
        icon: <FaExclamationTriangle />,
        timestamp: new Date()
      });
    }

    // Pending loans alert
    const pendingLoans = loans.filter(loan => loan.status === 'pending');
    if (pendingLoans.length > 0) {
      newAlerts.push({
        id: 'pending-loans',
        type: 'warning',
        title: 'Pending Approvals',
        message: `${pendingLoans.length} loan application${pendingLoans.length > 1 ? 's' : ''} awaiting review`,
        count: pendingLoans.length,
        priority: 'medium',
        action: () => navigate('/pendingloans'),
        icon: <FaClock />,
        timestamp: new Date()
      });
    }

    // Approved loans ready for disbursement
    const approvedLoans = loans.filter(loan => loan.status === 'approved');
    if (approvedLoans.length > 0) {
      newAlerts.push({
        id: 'approved-loans',
        type: 'info',
        title: 'Ready for Disbursement',
        message: `${approvedLoans.length} approved loan${approvedLoans.length > 1 ? 's' : ''} ready for disbursement`,
        count: approvedLoans.length,
        priority: 'medium',
        action: () => navigate('/approvedloans'),
        icon: <FaMoneyBill />,
        timestamp: new Date()
      });
    }

    // New customers this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newCustomers = customers.filter(customer => 
      new Date(customer.createdAt) > oneWeekAgo
    );
    if (newCustomers.length > 0) {
      newAlerts.push({
        id: 'new-customers',
        type: 'success',
        title: 'New Customers',
        message: `${newCustomers.length} new customer${newCustomers.length > 1 ? 's' : ''} registered this week`,
        count: newCustomers.length,
        priority: 'low',
        action: () => navigate('/customers'),
        icon: <FaUser />,
        timestamp: new Date()
      });
    }

    // Loans approaching maturity
    const loansApproachingMaturity = loans.filter(loan => {
      if (loan.status !== 'disbursed' || !loan.maturityDate) return false;
      const maturityDate = new Date(loan.maturityDate);
      const daysToMaturity = Math.ceil((maturityDate - new Date()) / (1000 * 60 * 60 * 24));
      return daysToMaturity <= 7 && daysToMaturity > 0;
    });
    
    if (loansApproachingMaturity.length > 0) {
      newAlerts.push({
        id: 'approaching-maturity',
        type: 'warning',
        title: 'Loans Approaching Maturity',
        message: `${loansApproachingMaturity.length} loan${loansApproachingMaturity.length > 1 ? 's' : ''} maturing within 7 days`,
        count: loansApproachingMaturity.length,
        priority: 'high',
        action: () => navigate('/disbursedloans'),
        icon: <FaClock />,
        timestamp: new Date()
      });
    }

    // System performance alert (simulated)
    const systemPerformance = Math.random() * 100;
    if (systemPerformance < 80) {
      newAlerts.push({
        id: 'system-performance',
        type: 'error',
        title: 'System Performance',
        message: 'System performance is below optimal levels',
        count: 1,
        priority: 'high',
        action: () => navigate('/system-settings'),
        icon: <FaExclamationTriangle />,
        timestamp: new Date()
      });
    }

    // Sort alerts by priority and timestamp
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    newAlerts.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    setAlerts(newAlerts);
    setLoading(false);
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertStyles = (type) => {
    const styles = {
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400',
        button: 'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: 'text-yellow-600 dark:text-yellow-400',
        button: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700'
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700'
      },
      success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        icon: 'text-green-600 dark:text-green-400',
        button: 'bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700'
      }
    };
    return styles[type] || styles.info;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return badges[priority] || badges.medium;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">System Alerts</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={generateAlerts}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Refresh alerts"
          >
            <FaBell />
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">
            <FaCheckCircle />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">All Clear!</h4>
          <p className="text-gray-500 dark:text-gray-400">
            No alerts at the moment. Your system is running smoothly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const styles = getAlertStyles(alert.type);
            return (
              <div
                key={alert.id}
                className={`${styles.bg} ${styles.border} border-l-4 p-4 rounded-lg transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${styles.icon} bg-white dark:bg-gray-700 shadow-sm`}>
                      {alert.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${styles.text} flex-1`}>
                          {alert.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(alert.priority)}`}>
                            {alert.priority}
                          </span>
                          <span className="bg-white dark:bg-gray-700 px-2 py-1 text-xs font-bold rounded-full text-gray-600 dark:text-gray-300">
                            {alert.count}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm ${styles.text} mb-3`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={alert.action}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${styles.button} ${styles.text}`}
                        >
                          <FaEye className="inline mr-1" />
                          View Details
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
                    title="Dismiss alert"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
