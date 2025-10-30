// pages/Dashboard.jsx - Credit Jambo Savings Management System
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSystemColors } from "../hooks/useSystemColors";
import {
  FaMoneyBill,
  FaEye,
  FaShieldAlt,
  FaChartLine,
  FaUsers,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaBox,
  FaStar,
} from "react-icons/fa";
import DashCard from "../components/DashCard";
import Table from "../components/Table";
import Loader from "../components/Loader";
import Skeleton, { DashboardCardSkeleton, TableSkeleton } from "../components/Skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { colors } = useSystemColors();
  const {
    user,
    customers = [],
    loading: contextLoading,
    customersLoading,
    api,
  } = useAppContext();

  // Fallback colors in case the hook fails
  const fallbackColors = {
    primary: '#00b050',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  // Use colors from hook or fallback
  const currentColors = colors || fallbackColors;

  // Savings management state
  const [savingsStats, setSavingsStats] = useState({
    totalAccounts: 0,
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeAccounts: 0,
    verifiedCustomers: 0,
    pendingVerifications: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [accountProductsStats, setAccountProductsStats] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadDashboardData = useCallback(async () => {
    console.log('🔄 Loading dashboard data...');
    setDashboardLoading(true);
    try {
      // Fetch savings accounts statistics
      const { data: accountsData } = await api.get('/savings-accounts/stats/overview');
      console.log('📊 Savings stats response:', accountsData);
      if (accountsData.success) {
        setSavingsStats(accountsData.data);
      }
    } catch (error) {
      console.error('Error fetching savings stats:', error);
    }

    try {
      // Fetch recent transactions
      const { data: transactionsData } = await api.get('/transactions/recent');
      console.log('💳 Transactions response:', transactionsData);
      if (transactionsData.success) {
        setRecentTransactions(transactionsData.data);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }

    try {
      // Fetch account products with stats
      const { data: productsData } = await api.get('/account-products');
      console.log('📦 Account products response:', productsData);
      if (productsData.success) {
        // Get stats for each product
        const productsWithStats = await Promise.all(
          productsData.data.map(async (product) => {
            try {
              const { data: statsData } = await api.get(`/account-products/${product._id}/stats`);
              return {
                ...product,
                totalAccounts: statsData.success ? statsData.data.totalAccounts : 0
              };
            } catch (error) {
              return { ...product, totalAccounts: 0 };
            }
          })
        );
        setAccountProductsStats(productsWithStats);
      }
    } catch (error) {
      console.error('Error fetching account products:', error);
    } finally {
      setDashboardLoading(false);
      setDataLoaded(true);
      console.log('✅ Dashboard data loading completed');
    }
  }, [api]);

  // Load dashboard data when user is available and context is not loading
  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered:', { user: !!user, contextLoading, dashboardLoading });
    // Only load data if user is authenticated and not loading
    if (!user || contextLoading) return;

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadDashboardData, user, contextLoading]);

  // Reset data loaded state when user changes
  useEffect(() => {
    if (user) {
      setDataLoaded(false);
      setDashboardLoading(true);
    }
  }, [user]);

  // Additional effect to ensure data loads when component mounts with user already available
  useEffect(() => {
    console.log('🔄 Dashboard mount effect triggered:', { user: !!user, contextLoading, dataLoaded });
    if (user && !contextLoading && !dataLoaded) {
      // Only load if we haven't loaded yet
      loadDashboardData();
    }
  }, [user, contextLoading, loadDashboardData, dataLoaded]);

  // Show loading state only for initial context loading
  if (contextLoading) return <Loader />;

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  // Calculate savings management statistics
  const totalCustomers = Array.isArray(customers) ? customers.length : 0;
  const verifiedCustomers = Array.isArray(customers) ? customers.filter(customer => customer.deviceVerified).length : 0;
  const pendingVerifications = Array.isArray(customers) ? customers.filter(customer => customer.deviceVerified === false).length : 0;
  const rejectedVerifications = Array.isArray(customers) ? customers.filter(customer => customer.deviceVerified === 'rejected').length : 0;
  const activeSavingsAccounts = savingsStats.activeAccounts || 0;
  const totalSavingsBalance = savingsStats.totalBalance || 0;
  const totalDeposits = savingsStats.totalDeposits || 0;
  const totalWithdrawals = savingsStats.totalWithdrawals || 0;

  // Debug: Log savings stats (check browser console for these values)
  console.log('🔍 Savings Stats:', savingsStats);
  console.log('🔍 Total Deposits from Stats:', totalDeposits);
  console.log('🔍 Total Withdrawals from Stats:', totalWithdrawals);

  // Utility function to format currency amounts
  const formatCurrency = (amount) => {
    const amountInMillions = amount / 1000000;
    if (amountInMillions >= 1000) {
      const amountInBillions = amountInMillions / 1000;
      return `Frw ${amountInBillions.toFixed(2)}B`;
    } else {
      return `Frw ${amountInMillions.toFixed(2)}M`;
    }
  };

  // Chart data for savings accounts
  const accountStatusData = [
    { name: 'Active', value: activeSavingsAccounts, color: '#10B981' },
    { name: 'Inactive', value: (savingsStats.totalAccounts || 0) - activeSavingsAccounts, color: '#6B7280' }
  ].filter(item => item.value > 0);

  const transactionTypeData = [
    { name: 'Deposits', value: totalDeposits, color: '#10B981' },
    { name: 'Withdrawals', value: totalWithdrawals, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Debug logging
  console.log('Transaction Type Data:', transactionTypeData);
  console.log('Total Deposits:', totalDeposits, 'Total Withdrawals:', totalWithdrawals);

  const recentTransactionsData = recentTransactions.slice(0, 5).map(transaction => ({
    id: transaction._id,
    customer: transaction.customer?.fullName || transaction.customerId?.personalInfo?.fullName || "Unknown",
    type: transaction.type || transaction.transactionType,
    amount: formatCurrency(transaction.amount),
    date: new Date(transaction.createdAt).toLocaleDateString(),
    status: transaction.status
  }));

  const recentCustomersData = Array.isArray(customers) 
    ? customers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(customer => ({
          id: customer._id,
          name: customer.fullName || "Unknown",
          email: customer.email || "N/A",
          phone: customer.phone || "N/A",
          verified: customer.deviceVerified ? "Yes" : "No",
          date: new Date(customer.createdAt).toLocaleDateString()
        }))
    : [];


  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 md:gap-12 min-h-screen">
      {/* Header */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Savings Management Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 font-medium">
              Monitor and manage customer savings accounts
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={dashboardLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <FaSync className={`${dashboardLoading ? 'animate-spin' : ''}`} />
            {dashboardLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 w-full">
          {dashboardLoading ? (
            // Show skeleton cards while loading dashboard data
            Array.from({ length: 8 }).map((_, index) => (
              <DashboardCardSkeleton key={index} />
            ))
          ) : (
            <>
              <DashCard
                title="Total Customers"
                number={totalCustomers.toString()}
                subtitle={`Verified: ${verifiedCustomers}`}
                icon={<FaUsers size={18} style={{ color: currentColors.primary }} />}
                description="Total number of registered customers in the savings system"
              />
              <DashCard
                title="Verified Customers"
                number={verifiedCustomers.toString()}
                subtitle={`${((verifiedCustomers / totalCustomers) * 100).toFixed(1)}% verified`}
                icon={<FaShieldAlt size={18} style={{ color: currentColors.success }} />}
                description="Customers with verified devices who can access their accounts"
              />
              <DashCard
                title="Pending Verifications"
                number={pendingVerifications.toString()}
                subtitle="Awaiting admin approval"
                icon={<FaShieldAlt size={18} className="text-yellow-500" />}
                description="Customer device verifications pending admin approval"
              />
              <DashCard
                title="Rejected Verifications"
                number={rejectedVerifications.toString()}
                subtitle="Require attention"
                icon={<FaShieldAlt size={18} className="text-red-500" />}
                description="Customer device verifications that were rejected and may need review"
              />
              <DashCard
                title="Active Savings Accounts"
                number={activeSavingsAccounts.toString()}
                subtitle="Currently active"
                icon={<FaWallet size={18} style={{ color: currentColors.primary }} />}
                description="Number of active savings accounts in the system"
              />
              <DashCard
                title="Total Savings Balance"
                number={formatCurrency(totalSavingsBalance)}
                subtitle="All accounts combined"
                icon={<FaMoneyBill size={18} style={{ color: currentColors.success }} />}
                description="Total amount held in all savings accounts"
              />
              <DashCard
                title="Total Deposits"
                number={formatCurrency(totalDeposits)}
                subtitle="This period"
                icon={<FaArrowUp size={18} className="text-green-600" />}
                description="Total amount deposited by customers"
              />
              <DashCard
                title="Total Withdrawals"
                number={formatCurrency(totalWithdrawals)}
                subtitle="This period"
                icon={<FaArrowDown size={18} className="text-red-600" />}
                description="Total amount withdrawn by customers"
              />
              <DashCard
                title="Net Savings"
                number={formatCurrency(totalDeposits - totalWithdrawals)}
                subtitle="Deposits - Withdrawals"
                icon={<FaChartLine size={18} style={{ color: currentColors.primary }} />}
                description="Net savings activity (deposits minus withdrawals)"
              />
              <DashCard
                title="Total Products"
                number={accountProductsStats.length.toString()}
                subtitle={`${accountProductsStats.filter(p => p.isActive).length} active`}
                icon={<FaBox size={18} style={{ color: currentColors.primary }} />}
                description="Total number of account products available"
              />
              <DashCard
                title="Most Popular Product"
                number={accountProductsStats.length > 0 
                  ? accountProductsStats.reduce((max, product) => 
                      (product.totalAccounts || 0) > (max.totalAccounts || 0) ? product : max
                    ).productName.substring(0, 15)
                  : 'N/A'}
                subtitle={accountProductsStats.length > 0 
                  ? `${accountProductsStats.reduce((max, product) => 
                      (product.totalAccounts || 0) > (max.totalAccounts || 0) ? product : max
                    ).totalAccounts} accounts`
                  : ''}
                icon={<FaStar size={18} style={{ color: currentColors.accent }} />}
                description="Product with the most accounts"
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Visual insights into savings performance and trends</p>
          </div>
        </div>
        
        {dashboardLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Chart skeletons */}
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex justify-center items-center h-64">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Account Status Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Account Status Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Current status of all savings accounts</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={accountStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {accountStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${name} : ${value}`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {accountStatusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Type Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Transaction Types</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Deposits vs Withdrawals comparison</p>
            {transactionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={transactionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#10B981" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-2">No Transaction Data Available</p>
                  <p className="text-gray-500 text-sm">Transaction statistics will appear here once transactions are recorded</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Account Products Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mt-6">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Account Products Usage</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Distribution of customers across different products</p>
          {accountProductsStats.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accountProductsStats.map(p => ({ name: p.productName, accounts: p.totalAccounts || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accounts" fill="#8B5CF6" name="Accounts" />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No account products data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Latest transactions and customer registrations</p>
          </div>
        </div>
        
        {dashboardLoading ? (
          <div className="space-y-6">
            {/* Recent Transactions skeleton */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-2 h-8" />
                <Skeleton className="h-6 w-48" />
              </div>
              <TableSkeleton rows={5} columns={5} />
            </div>
            
            {/* Recent Customers skeleton */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-2 h-8" />
                <Skeleton className="h-6 w-56" />
              </div>
              <TableSkeleton rows={5} columns={5} />
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          <Table
            headers={["Customer", "Type", "Amount", "Status", "Date"]}
            data={recentTransactionsData}
            renderCell={(row, header) => {
              switch (header) {
                case "Type":
                  return (
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: row.type === "deposit" 
                          ? `${currentColors.success}15` 
                          : `${currentColors.error}15`,
                        color: row.type === "deposit" 
                          ? currentColors.success 
                          : currentColors.error,
                        border: `1px solid ${row.type === "deposit" 
                          ? `${currentColors.success}30` 
                          : `${currentColors.error}30`}`
                      }}
                    >
                      {row.type}
                    </span>
                  );
                case "Amount":
                  return (
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {row.amount}
                    </span>
                  );
                case "Customer":
                  return (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {row.customer}
                    </span>
                  );
                default:
                  return (
                    <span className="text-gray-700 dark:text-gray-100">
                      {row[header.toLowerCase()]}
                    </span>
                  );
              }
            }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Recently Added Customers
            </h3>
          </div>
          <Table
            headers={[
              "Customer Name",
              "Email",
              "Phone",
              "Verified",
              "Registration Date",
            ]}
            data={recentCustomersData}
            renderCell={(row, header) => {
              switch (header) {
                case "Customer Name":
  return (
                    <div className="flex items-center gap-3">
                      <FaEye
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors duration-200"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        onClick={() => navigate(`/customers/${row.id}`)}
                        title="View Customer Details"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {row.name}
                      </span>
                    </div>
                  );
                case "Verified":
                  return (
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: row.verified === "Yes" 
                          ? `${currentColors.success}15` 
                          : `${currentColors.warning}15`,
                        color: row.verified === "Yes" 
                          ? currentColors.success 
                          : currentColors.warning,
                        border: `1px solid ${row.verified === "Yes" 
                          ? `${currentColors.success}30` 
                          : `${currentColors.warning}30`}`
                      }}
                    >
                      {row.verified}
                    </span>
                  );
                case "Email":
                  return (
                    <span className="text-gray-700 dark:text-gray-100">
                      {row.email}
                    </span>
                  );
                case "Phone":
                  return (
                    <span className="text-gray-700 dark:text-gray-100">
                      {row.phone}
                    </span>
                  );
                case "Registration Date":
                  return (
                    <span className="text-gray-700 dark:text-gray-100">
                      {row.date}
                    </span>
                  );
                default:
                  return (
                    <span className="text-gray-700 dark:text-gray-100">
                      {row[header.toLowerCase().replace(/\s/g, "")] || "-"}
                    </span>
                  );
              }
            }}
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
