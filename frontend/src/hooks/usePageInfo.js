import { useLocation } from 'react-router-dom';

/**
 * Custom hook to get current page information for audit logging
 * @returns {Object} Page information including route and title
 */
export const usePageInfo = () => {
  const location = useLocation();
  
  // Map routes to human-readable page titles
  const pageTitleMap = {
    '/dashboard': 'Dashboard',
    '/customers': 'Customer List',
    '/addcustomer': 'Add Customer',
    '/loanslist': 'Loans List',
    '/addloan': 'Add Loan',
    '/approvedloans': 'Approved Loans',
    '/disbursmentloans': 'Disbursement Loans',
    '/disbursedloans': 'Disbursed Loans',
    '/pendingloans': 'Pending Loans',
    '/completedloans': 'Completed Loans',
    '/rejectedloans': 'Rejected Loans',
    '/branches': 'Branch List',
    '/addbranch': 'Add Branch',
    '/notifications': 'Notifications',
    '/activity-logs': 'Activity Logs',
    '/enhanced-audit-trail': 'Enhanced Audit Trail',
    '/session-management': 'Session Management',
    '/profile': 'User Profile',
    '/expenses': 'Expenses',
    '/addexpense': 'Add Expense',
    '/employees': 'Employee List',
    '/addemployee': 'Add Employee',
    '/attendance': 'Attendance',
    '/attendance-clock': 'Attendance Clock',
    '/leaves': 'Leave Management',
    '/addleave': 'Add Leave',
    '/holidays': 'Holiday Management',
    '/addholiday': 'Add Holiday',
    '/salaries': 'Salary Management',
    '/performance': 'Performance Management',
    '/addperformance': 'Add Performance',
    '/training': 'Training Management',
    '/addtraining': 'Add Training',
    '/disciplinary': 'Disciplinary Management',
    '/adddisciplinary': 'Add Disciplinary',
    '/tasks': 'Task Management',
    '/addtask': 'Add Task',
    '/loan-products': 'Loan Products',
    '/addloanproduct': 'Add Loan Product',
    '/financial-statements': 'Financial Statements',
    '/chart-of-accounts': 'Chart of Accounts',
    '/general-ledger': 'General Ledger',
    '/trial-balance': 'Trial Balance',
    '/profit-loss': 'Profit & Loss',
    '/balance-sheet': 'Balance Sheet',
    '/cash-flow': 'Cash Flow',
    '/tax-management': 'Tax Management',
    '/loan-classification': 'Loan Classification',
    '/active-loans-report': 'Active Loans Report',
    '/loan-recovery-report': 'Loan Recovery Report',
    '/system-settings': 'System Settings'
  };

  // Get the current pathname
  const currentPath = location.pathname;
  
  // Extract page title from the map or generate from path
  const getPageTitle = (path) => {
    // Check for exact match first
    if (pageTitleMap[path]) {
      return pageTitleMap[path];
    }
    
    // Check for dynamic routes (e.g., /customers/123, /loans/edit/456)
    const pathSegments = path.split('/');
    const basePath = `/${pathSegments[1]}`;
    
    if (pageTitleMap[basePath]) {
      // For detail/edit pages, add context
      if (pathSegments.length > 2) {
        if (pathSegments[2] === 'edit') {
          return `Edit ${pageTitleMap[basePath].replace(' List', '').replace(' Add', '')}`;
        } else if (pathSegments[2] === 'details') {
          return `${pageTitleMap[basePath].replace(' List', '').replace(' Add', '')} Details`;
        } else {
          return `${pageTitleMap[basePath].replace(' List', '').replace(' Add', '')} Details`;
        }
      }
      return pageTitleMap[basePath];
    }
    
    // Fallback: generate title from path
    return pathSegments
      .filter(segment => segment)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  };

  return {
    page: currentPath,
    pageTitle: getPageTitle(currentPath),
    pathname: currentPath
  };
};

export default usePageInfo;
