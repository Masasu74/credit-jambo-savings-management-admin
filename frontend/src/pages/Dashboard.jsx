// pages/Dashboard.jsx - Credit Jambo Savings Management System
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSystemColors } from "../hooks/useSystemColors";
import {
  FaUser,
  FaMoneyBill,
  FaEye,
  FaShieldAlt,
  FaCreditCard,
  FaChartLine,
  FaUsers,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import DashCard from "../components/DashCard";
import Table from "../components/Table";
import Loader from "../components/Loader";
import { DashboardCardSkeleton } from "../components/Skeleton";
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
  const [deviceVerifications, setDeviceVerifications] = useState([]);

  useEffect(() => {
    // Only load data if user is authenticated
    if (!user) return;

    const loadData = async () => {
      try {
        // Fetch savings accounts statistics
        const { data: accountsData } = await api.get('/savings-accounts/stats/overview');
        if (accountsData.success) {
          setSavingsStats(accountsData.data);
        }
      } catch (error) {
        console.error('Error fetching savings stats:', error);
      }

      try {
        // Fetch recent transactions
        const { data: transactionsData } = await api.get('/transactions/recent');
        if (transactionsData.success) {
          setRecentTransactions(transactionsData.data);
        }
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      }

      try {
        // Fetch device verifications
        const { data: verificationsData } = await api.get('/device-verifications/recent');
        if (verificationsData.success) {
          setDeviceVerifications(verificationsData.data);
        }
      } catch (error) {
        console.error('Error fetching device verifications:', error);
      }
    };
    loadData();
  }, [api, user]);


  if (contextLoading) return <Loader />;

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  // Calculate savings management statistics
  const totalCustomers = customers?.length || 0;
  const verifiedCustomers = customers.filter(customer => customer.deviceVerified).length;
  const pendingVerifications = customers.filter(customer => !customer.deviceVerified).length;
  const activeSavingsAccounts = savingsStats.activeAccounts || 0;
  const totalSavingsBalance = savingsStats.totalBalance || 0;
  const totalDeposits = savingsStats.totalDeposits || 0;
  const totalWithdrawals = savingsStats.totalWithdrawals || 0;

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

  const recentTransactionsData = recentTransactions.slice(0, 5).map(transaction => ({
    id: transaction._id,
    customer: transaction.customer?.personalInfo?.fullName || "Unknown",
    type: transaction.transactionType,
    amount: formatCurrency(transaction.amount),
    date: new Date(transaction.createdAt).toLocaleDateString(),
    status: transaction.status
  }));

  const recentCustomersData = customers
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(customer => ({
      id: customer._id,
      name: customer.personalInfo?.fullName || "Unknown",
      email: customer.contact?.email || "N/A",
      phone: customer.contact?.phone || "N/A",
      verified: customer.deviceVerified ? "Yes" : "No",
      date: new Date(customer.createdAt).toLocaleDateString()
    }));


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
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 w-full">
          {customersLoading ? (
            // Show skeleton cards while loading
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
          </div>
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
      </div>
    </div>
  );

  return (
    <PerformanceOptimization>
      <MobileResponsiveWrapper title="Dashboard Overview">
        <div className="w-full flex flex-col gap-6 sm:gap-8 md:gap-12 min-h-screen">
          {/* Quick Actions Panel - Moved to Top */}
          <QuickActionsPanel />
          {/* Dashboard Cards Section */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Dashboard Overview</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 font-medium">Real-time insights into your financial operations</p>
              </div>
            </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 w-full">
          {customersLoading || loansLoading ? (
            // Show skeleton cards while loading
            Array.from({ length: 12 }).map((_, index) => (
              <DashboardCardSkeleton key={index} />
            ))
          ) : (
          <>
            <DashCard
              title="Total Customers"
              number={totalCustomers.toString()}
              subtitle={`New this Week (${
                customers.filter(
                  (c) => new Date(c.createdAt) > new Date(Date.now() - 604800000)
                ).length
              })`}
              icon={<FaUser size={18} style={{ color: currentColors.success }} />}
              description="Total number of customers who have registered for our loan services. This includes individuals and businesses."
            />
            <DashCard
              title="Active Loans"
              number={activeLoans.toString()}
              subtitle={`Disbursed (${ongoingLoans}) + Overdue (${overdueLoansList.length})`}
              icon={<FaMoneyBill size={18} style={{ color: currentColors.primary }} />}
              description="Total number of active loans including disbursed and overdue loans. These are loans currently being serviced by customers."
            />
            <DashCard
              title="Approved Loans"
              number={approvedLoans.toString()}
              icon={<FaBookmark size={18} style={{ color: currentColors.success }} />}
              description="Loans that have been approved and are ready to be given out to customers."
            />
            <DashCard
              title="Disbursed Loans"
              number={ongoingLoans.toString()}
              icon={<FaMoneyBill size={18} style={{ color: currentColors.primary }} />}
              description="Loans that have been given to customers and are currently active. These customers are making regular payments."
            />
            <DashCard
              title="Pending Loans"
              number={pendingLoans.length.toString()}
              icon={<FaBookmark size={18} className="text-yellow-500" />}
              description="Loan applications that are being reviewed by our loan officers. We check each application carefully."
            />
            <DashCard
              title="Rejected Loans"
              number={rejectedLoans.toString()}
              icon={<FaBookmark size={18} className="text-red-500" />}
              description="Loan applications that were not approved because they did not meet our lending requirements."
            />
            <DashCard
              title="Due and Full Paid"
              number={completedLoans.toString()}
              icon={<FaCheck size={18} style={{ color: currentColors.primary }} />}
              description="Loans that have been fully paid back by customers. These are successful loan agreements."
            />
            <DashCard
              title="Overdue Loans"
              number={overdueLoansList.length.toString()}
              icon={<FaBookmark size={18} className="text-red-600" />}
              description="Loans where customers have missed payments. Our team works with customers to help them get back on track."
            />
            <DashCard
              title="Total Loan Book"
              number={formatCurrency(totalLoanAmount)}
              subtitle="Disbursed + Completed Loans"
              icon={<FaMoneyBill size={18} style={{ color: currentColors.success }} />}
              description="Total amount of money given out in loans. This shows the size of our loan business."
            />
            <DashCard
              title="Total Outstanding Amount"
              number={formatCurrency(earnings.totalApprovedAmount)}
              subtitle="From disbursed loans only"
              icon={<FaMoneyBill size={18} className="text-indigo-600" />}
              description="Total amount of money currently lent out to customers. This is the main amount they still need to pay back."
            />
            <DashCard
              title="Overdue Loans Outstanding"
              number={formatCurrency(overdueLoansList.reduce((sum, loan) => {
                const disbursedAmount = loan.disbursedAmount || loan.amount || 0;
                const interestRate = loan.interestRate || 4.5;
                const durationMonths = loan.durationMonths || 12;
                const totalInterest = disbursedAmount * (interestRate / 100) * durationMonths;
                
                // Calculate fees using product-based calculation if available
                let totalFees = 0;
                if (loan.product && loan.product.fees) {
                  const fees = loan.product.fees;
                  
                  // Calculate processing fee
                  const processingFee = fees.processingFeeType === 'percentage' 
                    ? (disbursedAmount * fees.processingFee) / 100 
                    : fees.processingFee || 0;
                  
                  // Calculate application fee
                  const applicationFee = fees.applicationFeeType === 'percentage'
                    ? (disbursedAmount * fees.applicationFee) / 100
                    : fees.applicationFee || 0;
                  
                  // Calculate disbursement fee
                  const disbursementFee = fees.disbursementFeeType === 'percentage'
                    ? (disbursedAmount * fees.disbursementFee) / 100
                    : fees.disbursementFee || 0;
                  
                  // Fixed fees
                  const insuranceFee = fees.insuranceFee || 0;
                  const legalFee = fees.legalFee || 0;
                  
                  // Calculate other fees
                  let otherFees = 0;
                  if (fees.otherFees && fees.otherFees.length > 0) {
                    otherFees = fees.otherFees.reduce((total, fee) => {
                      if (fee.type === 'percentage') {
                        return total + (disbursedAmount * fee.amount) / 100;
                      } else {
                        return total + fee.amount;
                      }
                    }, 0);
                  }
                  
                  totalFees = processingFee + applicationFee + disbursementFee + insuranceFee + legalFee + otherFees;
                } else {
                  // Fallback to default fees (1% + 2% = 3%)
                  totalFees = disbursedAmount * 0.03;
                }
                
                return sum + disbursedAmount + totalInterest + totalFees;
              }, 0))}
              subtitle="Principal + Interest + Fees"
              icon={<FaBookmark size={18} className="text-red-600" />}
              description="Total outstanding amount on overdue loans including principal, interest, and fees."
            />
            <DashCard
              title="Outstanding Loans Collaterals"
              number={formatCurrency(totalCollateralDisbursed)}
              icon={<FaBalanceScale size={18} className="text-indigo-600" />}
              description="Total value of items customers have given as security for their active loans."
            />
            <DashCard
              title="Collateral Loan Book"
              number={formatCurrency(totalCollateralDisbursedAndCompleted)}
              icon={<FaBalanceScale size={18} className="text-purple-600" />}
              description="Total value of all security items from both active and completed loans."
            />
            <DashCard
              title="Daily Earnings"
              number={formatCurrency(earnings.daily)}
              subtitle="From disbursed loans only"
              icon={<FaMoneyBill size={18} className="text-emerald-600" />}
              description="Money we earn each day from interest on active loans. This helps us keep our business running."
            />
            <DashCard
              title="Current Period Earnings"
              number={formatCurrency(earnings.monthly)}
              subtitle="From disbursed loans only"
              icon={<FaMoneyBill size={18} style={{ color: currentColors.primary }} />}
              description="Money we earn each month from interest on active loans. This income helps us improve our services."
            />
            <DashCard
              title="Total Interest Earned"
              number={formatCurrency(totalInterestEarned)}
              subtitle="From completed loans"
              icon={<FaMoneyBill size={18} className="text-amber-600" />}
              description="Total interest earned from loans that have been fully paid back. This shows our past success."
            />
            <DashCard
              title="Retained Earnings"
              number={formatCurrency(retainedEarnings)}
              subtitle="Accumulated profits"
              icon={<FaMoneyBill size={18} className="text-green-600" />}
              description="Total accumulated profits from previous years that have been retained in the business."
            />
            {expenseStats && (
              <>
                <DashCard
                  title="Total Expenses"
                  number={formatCurrency(expenseStats.totalAmount)}
                  subtitle={`${expenseStats.count} expenses`}
                  icon={<FaReceipt size={18} className="text-red-500" />}
                  description="Total money spent on running our business. This includes staff costs, technology, and other expenses."
                />
                <DashCard
                  title="Tax Deductible"
                  number={formatCurrency(expenseStats.totalTaxDeductible)}
                  subtitle={`${((expenseStats.totalTaxDeductible / expenseStats.totalAmount) * 100).toFixed(1)}% of total`}
                  icon={<FaReceipt size={18} style={{ color: currentColors.success }} />}
                  description="Business expenses that can be deducted from our taxes. This helps reduce our tax payments."
                />
                <DashCard
                  title="Pending Expenses"
                  number={expenseStats.pendingCount.toString()}
                  subtitle={`${((expenseStats.pendingCount / expenseStats.count) * 100).toFixed(1)}% of total`}
                  icon={<FaReceipt size={18} className="text-yellow-500" />}
                  description="Expense requests waiting for approval. We review all expenses before they are paid."
                />
              </>
            )}
            {loanClassificationStats && (
              <>
                <DashCard
                  title="Loan Classifications"
                  number={loanClassificationStats.totalLoans.toString()}
                  subtitle={`${formatCurrency(loanClassificationStats.totalOutstanding)} outstanding`}
                  icon={<FaShieldAlt size={18} className="text-indigo-600" />}
                  description="Total active loans with risk classification. This helps us monitor loan portfolio health and set aside provisions."
                />
                <DashCard
                  title="Normal Loans"
                  number={loanClassificationStats.classifications.normal.count.toString()}
                  subtitle={`${formatCurrency(loanClassificationStats.classifications.normal.amount)} amount`}
                  icon={<FaShieldAlt size={18} className="text-green-600" />}
                  description="Loans performing well with no payment delays. These are our lowest risk loans."
                />
                <DashCard
                  title="Watch List Loans"
                  number={loanClassificationStats.classifications.watch.count.toString()}
                  subtitle={`${formatCurrency(loanClassificationStats.classifications.watch.amount)} amount`}
                  icon={<FaShieldAlt size={18} className="text-yellow-600" />}
                  description="Loans with minor payment delays (1-89 days). We monitor these closely to prevent further deterioration."
                />
                <DashCard
                  title="Non-Performing Loans"
                  number={(
                    loanClassificationStats.classifications.substandard.count +
                    loanClassificationStats.classifications.doubtful.count +
                    loanClassificationStats.classifications.loss.count +
                    loanClassificationStats.classifications.writeoff.count
                  ).toString()}
                  subtitle={`${formatCurrency(
                    loanClassificationStats.classifications.substandard.amount +
                    loanClassificationStats.classifications.doubtful.amount +
                    loanClassificationStats.classifications.loss.amount +
                    loanClassificationStats.classifications.writeoff.amount
                  )} amount`}
                  icon={<FaShieldAlt size={18} className="text-red-600" />}
                  description="Loans with significant payment delays (90+ days). These require immediate attention and recovery actions."
                />
                <DashCard
                  title="Total Provisions Required"
                  number={formatCurrency(loanClassificationStats.totalProvision)}
                  subtitle={`${((loanClassificationStats.totalProvision / loanClassificationStats.totalOutstanding) * 100).toFixed(1)}% of portfolio`}
                  icon={<FaShieldAlt size={18} className="text-orange-600" />}
                  description="Total amount we need to set aside as provisions for potential loan losses. This protects our financial stability."
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Visual insights into loan performance and trends</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Loan Status Distribution Pie Chart - Matching the image design */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Loan Status Distribution</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Current status of all loans in the portfolio</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={loanStatusData}
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
                {loanStatusData.map((entry, index) => (
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
          
          {/* Custom Legend - Matching the image design */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {loanStatusData.map((entry, index) => (
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

        {/* Monthly Loan Amounts Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Monthly Disbursed Loan Amounts (Last 6 Months)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Shows total disbursed amounts of loans with disbursed status by month</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#10B981" name="Disbursed Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Loan Type Distribution */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Loan Type Distribution</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Shows total amounts by loan type for disbursed loans only</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={loanTypeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#8B5CF6" name="Total Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer vs Loan Ratio */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Customer vs Loan Distribution</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Shows ratio between customers and loan statuses</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={customerLoanRatio}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => {
                  // Only show label if percentage is significant (>5%) or if it's the only item
                  if (percent > 0.05 || customerLoanRatio.length === 1) {
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }
                  return '';
                }}
                outerRadius={80}
                innerRadius={20}
                fill="#8884d8"
                dataKey="value"
              >
                {customerLoanRatio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value}`, name]}
                labelFormatter={(label) => `${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Latest loan applications and customer registrations</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Recent Loan Activity</h3>
          </div>
          <Table
            headers={["Customer", "Amount", "LoanType", "Status", "Date"]}
            data={recentLoans}
            renderCell={(row, header) => {
              switch (header) {
                case "Status":
                  return (
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: row.status === "approved" 
                          ? `${currentColors.success}15` 
                          : row.status === "pending"
                          ? `${currentColors.warning}15`
                          : `${currentColors.error}15`,
                        color: row.status === "approved" 
                          ? currentColors.success 
                          : row.status === "pending"
                          ? currentColors.warning
                          : currentColors.error,
                        border: `1px solid ${row.status === "approved" 
                          ? `${currentColors.success}30` 
                          : row.status === "pending"
                          ? `${currentColors.warning}30`
                          : `${currentColors.error}30`}`
                      }}
                    >
                      {row.status}
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
              "Registration Date",
              "ID Number",
              "Contact",
            ]}
            data={customers
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)}
            renderCell={(row, header) => {
              switch (header) {
                case "Customer Name":
                  return (
                    <div className="flex items-center gap-3">
                      <FaEye
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors duration-200"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        onClick={() => navigate(`/customers/${row._id}`)}
                        title="View Customer Details"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {row.personalInfo?.fullName || "Unknown"}
                      </span>
                    </div>
                  );
                case "Registration Date":
                  return (
                    <span className="text-gray-700 dark:text-gray-100">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "-"}
                    </span>
                  );
                case "ID Number":
                  return (
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-600 px-2 py-1 rounded">
                      {row.personalInfo?.idNumber || "N/A"}
                    </span>
                  );
                case "Contact":
                  return (
                    <div className="space-y-1">
                      <div className="text-gray-700 dark:text-gray-100">
                        {row.contact?.phone || "N/A"}
                      </div>
                      <div className="text-gray-600 dark:text-gray-200 text-sm">
                        {row.contact?.email || "N/A"}
                      </div>
                    </div>
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
      </div>

          {/* New Enhanced Dashboard Components */}
          <div className="space-y-6 sm:space-y-8">
            {/* Performance Metrics */}
            <LazyWrapper>
              <PerformanceMetrics />
            </LazyWrapper>

            {/* Alerts Panel */}
            <AlertsPanel />

            {/* Upcoming Payments */}
            <UpcomingPayments />

            {/* Enhanced Charts */}
            <LazyWrapper>
              <EnhancedCharts />
            </LazyWrapper>
          </div>

        </div>
      </MobileResponsiveWrapper>
    </PerformanceOptimization>
  );
};

export default Dashboard;
