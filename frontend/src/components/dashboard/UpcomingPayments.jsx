import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaMoneyBill, 
  FaUser, 
  FaClock, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaFilter
} from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { useSystemColors } from '../../hooks/useSystemColors';
import { safeDisplayName } from '../../utils/safeRender';
// Removed loanTypeUtils import - no longer needed for savings management

const UpcomingPayments = () => {
  const navigate = useNavigate();
  const { loans = [], api } = useAppContext();
  const { colors } = useSystemColors();
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month

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
    generateUpcomingPayments();
  }, [loans, filter]);

  const generateUpcomingPayments = () => {
    setLoading(true);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Filter active loans (disbursed and overdue)
    const activeLoans = loans.filter(loan => 
      loan.status === 'disbursed' || loan.status === 'overdue'
    );

    const payments = [];

    activeLoans.forEach(loan => {
      if (!loan.maturityDate) return;

      const maturityDate = new Date(loan.maturityDate);
      const daysToMaturity = Math.ceil((maturityDate - now) / (1000 * 60 * 60 * 24));
      
      // Only include payments that are upcoming (not overdue)
      if (daysToMaturity >= 0) {
        let includePayment = false;
        
        switch (filter) {
          case 'today':
            includePayment = daysToMaturity === 0;
            break;
          case 'week':
            includePayment = daysToMaturity <= 7 && daysToMaturity >= 0;
            break;
          case 'month':
            includePayment = daysToMaturity <= 30 && daysToMaturity >= 0;
            break;
          default:
            includePayment = daysToMaturity <= 30 && daysToMaturity >= 0;
        }

        if (includePayment) {
          const disbursedAmount = loan.disbursedAmount || loan.amount || 0;
          const durationMonths = loan.durationMonths || 12;
          
          // Use product data if available, otherwise fallback to loan data
          const product = loan.product;
          
          let totalAmount;
          if (product && product.interestRate && product.fees) {
            // Use product-based calculations
            const calculation = calculateTotalLoanAmount(product, disbursedAmount, durationMonths);
            totalAmount = calculation.totalAmount;
          } else {
            // Fallback to old calculation method
            const interestRate = loan.interestRate || 4.5;
            const totalInterest = disbursedAmount * (interestRate / 100) * durationMonths;
            const totalFees = disbursedAmount * 0.03; // 3% default
            totalAmount = disbursedAmount + totalInterest + totalFees;
          }
          
          // Calculate monthly payment
          const monthlyPayment = totalAmount / durationMonths;

          payments.push({
            id: loan._id,
            customerName: loan.customer?.personalInfo?.fullName || loan.customerNo || 'Unknown Customer',
            customerId: loan.customer?._id || loan.customerNo,
            loanType: loan.product?.name || loan.loanType || 'Personal Loan',
            amount: monthlyPayment,
            totalAmount: totalAmount,
            dueDate: maturityDate,
            daysToMaturity: daysToMaturity,
            status: loan.status,
            contractNo: loan.contractNo || loan._id?.slice(-8),
            loanOfficer: safeDisplayName(loan.loanOfficer || loan.responsibleOfficer, 'N/A'),
            priority: daysToMaturity <= 1 ? 'urgent' : daysToMaturity <= 3 ? 'high' : daysToMaturity <= 7 ? 'medium' : 'low'
          });
        }
      }
    });

    // Sort by priority and due date
    payments.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    setUpcomingPayments(payments.slice(0, 10)); // Show top 10
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    const amountInMillions = amount / 1000000;
    if (amountInMillions >= 1) {
      return `Frw ${amountInMillions.toFixed(1)}M`;
    } else {
      return `Frw ${(amount / 1000).toFixed(0)}K`;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPriorityStyles = (priority) => {
    const styles = {
      urgent: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
      high: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-800 dark:text-orange-200',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      },
      medium: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      },
      low: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }
    };
    return styles[priority] || styles.low;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'high':
        return <FaClock className="text-orange-500" />;
      case 'medium':
        return <FaCalendarAlt className="text-yellow-500" />;
      default:
        return <FaCheckCircle className="text-green-500" />;
    }
  };

  const getDaysText = (days) => {
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days <= 7) return `Due in ${days} days`;
    return `Due in ${days} days`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Upcoming Payments</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={() => navigate('/reports/upcoming-payments')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="View all upcoming payments"
          >
            <FaEye />
          </button>
        </div>
      </div>

      {upcomingPayments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">
            <FaCheckCircle />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Upcoming Payments</h4>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'today' ? 'No payments due today.' :
             filter === 'week' ? 'No payments due this week.' :
             filter === 'month' ? 'No payments due this month.' :
             'No upcoming payments in the next 30 days.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingPayments.map((payment) => {
            const styles = getPriorityStyles(payment.priority);
            return (
              <div
                key={payment.id}
                className={`${styles.bg} ${styles.border} border-l-4 p-4 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer`}
                onClick={() => navigate(`/loans/${payment.id}`)}
              >
                <div className="space-y-3">
                  {/* Header with customer name and priority */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                      {payment.customerName}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getPriorityIcon(payment.priority)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badge}`}>
                        {payment.priority}
                      </span>
                    </div>
                  </div>
                  
                  {/* Amount and due date */}
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                      <div>{getDaysText(payment.daysToMaturity)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(payment.dueDate)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Loan details - stacked on mobile */}
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FaMoneyBill size={12} />
                      <span className="truncate">{payment.loanType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaUser size={12} />
                      <span className="truncate">{payment.loanOfficer}</span>
                    </div>
                    <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
                      {payment.contractNo}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {upcomingPayments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Showing {upcomingPayments.length} upcoming payments</span>
            <button
              onClick={() => navigate('/reports/upcoming-payments')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View All →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingPayments;
