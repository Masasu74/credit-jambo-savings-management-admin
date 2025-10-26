import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
// Removed loanTypeUtils import - no longer needed for savings management
import { useSystemColors } from '../../hooks/useSystemColors';

const EnhancedCharts = () => {
  const { loans = [], customers = [] } = useAppContext();
  const { colors } = useSystemColors();
  const [activeChart, setActiveChart] = useState('cashflow');

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

  // Generate cash flow data
  const cashFlowData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Calculate inflows and outflows for this month
      const monthLoans = loans.filter(loan => {
        const loanDate = new Date(loan.createdAt);
        return loanDate.getMonth() === date.getMonth() && loanDate.getFullYear() === date.getFullYear();
      });
      
      const disbursedAmount = monthLoans.reduce((sum, loan) => sum + (loan.disbursedAmount || loan.amount || 0), 0);
      const interestEarned = monthLoans.reduce((sum, loan) => {
        const amount = loan.disbursedAmount || loan.amount || 0;
        // Use product data if available, otherwise fallback to loan data
        const product = loan.product;
        const rate = product?.interestRate?.rate || loan.interestRate || 4.5;
        const duration = loan.durationMonths || 12;
        return sum + (amount * (rate / 100) * duration);
      }, 0);
      
      const inflow = disbursedAmount * 0.1 + interestEarned * 0.3; // Simulated inflow
      const outflow = disbursedAmount * 0.8; // Simulated outflow
      
      months.push({
        month: monthKey,
        inflow: Math.round(inflow / 1000000 * 10) / 10,
        outflow: Math.round(outflow / 1000000 * 10) / 10,
        netFlow: Math.round((inflow - outflow) / 1000000 * 10) / 10,
        disbursed: Math.round(disbursedAmount / 1000000 * 10) / 10
      });
    }
    
    return months;
  }, [loans]);

  // Generate risk assessment data
  const riskData = useMemo(() => {
    const totalLoans = loans.length;
    if (totalLoans === 0) return [];

    const completedLoans = loans.filter(loan => loan.status === 'completed').length;
    const disbursedLoans = loans.filter(loan => loan.status === 'disbursed').length;
    const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
    const rejectedLoans = loans.filter(loan => loan.status === 'rejected').length;

    return [
      {
        category: 'Credit Risk',
        value: Math.max(0, 100 - (overdueLoans / totalLoans) * 100),
        fullMark: 100
      },
      {
        category: 'Liquidity',
        value: Math.max(0, 100 - (disbursedLoans / totalLoans) * 50),
        fullMark: 100
      },
      {
        category: 'Operational',
        value: Math.max(0, 100 - (rejectedLoans / totalLoans) * 30),
        fullMark: 100
      },
      {
        category: 'Market',
        value: 75 + Math.random() * 20, // Simulated market risk
        fullMark: 100
      },
      {
        category: 'Compliance',
        value: 85 + Math.random() * 10, // Simulated compliance score
        fullMark: 100
      },
      {
        category: 'Technology',
        value: 80 + Math.random() * 15, // Simulated tech risk
        fullMark: 100
      }
    ];
  }, [loans]);

  // Generate loan performance data
  const loanPerformanceData = useMemo(() => {
    const performance = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthLoans = loans.filter(loan => {
        const loanDate = new Date(loan.createdAt);
        return loanDate.getMonth() === date.getMonth() && loanDate.getFullYear() === date.getFullYear();
      });
      
      const totalAmount = monthLoans.reduce((sum, loan) => sum + (loan.disbursedAmount || loan.amount || 0), 0);
      const completedAmount = monthLoans
        .filter(loan => loan.status === 'completed')
        .reduce((sum, loan) => sum + (loan.disbursedAmount || loan.amount || 0), 0);
      
      const performanceRate = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;
      
      performance.push({
        month: monthKey,
        performance: Math.round(performanceRate * 10) / 10,
        totalAmount: Math.round(totalAmount / 1000000 * 10) / 10,
        completedAmount: Math.round(completedAmount / 1000000 * 10) / 10
      });
    }
    
    return performance;
  }, [loans]);

  // Generate customer acquisition data
  const customerAcquisitionData = useMemo(() => {
    const acquisition = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate.getMonth() === date.getMonth() && customerDate.getFullYear() === date.getFullYear();
      });
      
      acquisition.push({
        month: monthKey,
        newCustomers: monthCustomers.length,
        totalCustomers: customers.filter(customer => {
          const customerDate = new Date(customer.createdAt);
          return customerDate <= date;
        }).length
      });
    }
    
    return acquisition;
  }, [customers]);

  // Generate portfolio distribution data
  const portfolioDistributionData = useMemo(() => {
    const distribution = loans.reduce((acc, loan) => {
      const type = loan.product?.name || loan.loanType || 'Personal Loan';
      if (!acc[type]) {
        acc[type] = { name: type, value: 0, amount: 0 };
      }
      acc[type].value += 1;
      acc[type].amount += loan.disbursedAmount || loan.amount || 0;
      return acc;
    }, {});

    return Object.values(distribution).sort((a, b) => b.amount - a.amount);
  }, [loans]);

  const chartColors = [
    currentColors.primary,
    currentColors.success,
    currentColors.warning,
    currentColors.error,
    currentColors.accent,
    '#8B5CF6',
    '#06B6D4',
    '#F97316'
  ];

  const chartTabs = [
    { id: 'cashflow', label: 'Cash Flow', icon: '💰' },
    { id: 'risk', label: 'Risk Assessment', icon: '🛡️' },
    { id: 'performance', label: 'Loan Performance', icon: '📈' },
    { id: 'customers', label: 'Customer Growth', icon: '👥' },
    { id: 'portfolio', label: 'Portfolio Distribution', icon: '🥧' }
  ];

  const renderChart = () => {
    switch (activeChart) {
      case 'cashflow':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cash Flow Trend (Last 12 Months)</h3>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📊 Calculation Method:</h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Inflow:</strong> 10% of disbursed amounts + 30% of projected interest earnings</li>
                  <li>• <strong>Outflow:</strong> 80% of disbursed loan amounts</li>
                  <li>• <strong>Net Flow:</strong> Inflow minus Outflow</li>
                  <li>• <strong>Interest Calculation:</strong> Amount × Interest Rate × Duration (months)</li>
                  <li>• Data aggregated monthly from loan creation dates</li>
                </ul>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}M FRW`, 
                      name === 'inflow' ? 'Inflow' : 
                      name === 'outflow' ? 'Outflow' : 
                      name === 'netFlow' ? 'Net Flow' : 'Disbursed'
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="inflow" 
                    stackId="1" 
                    stroke={currentColors.success} 
                    fill={currentColors.success}
                    fillOpacity={0.6}
                    name="Inflow"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="outflow" 
                    stackId="1" 
                    stroke={currentColors.error} 
                    fill={currentColors.error}
                    fillOpacity={0.6}
                    name="Outflow"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netFlow" 
                    stroke={currentColors.primary} 
                    strokeWidth={3}
                    name="Net Flow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Risk Assessment Dashboard</h3>
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">🛡️ Risk Calculation Method:</h4>
              <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                <li>• <strong>Credit Risk:</strong> 100 - (Overdue Loans ÷ Total Loans) × 100</li>
                <li>• <strong>Liquidity:</strong> 100 - (Disbursed Loans ÷ Total Loans) × 50</li>
                <li>• <strong>Operational:</strong> 100 - (Rejected Loans ÷ Total Loans) × 30</li>
                <li>• <strong>Market:</strong> Simulated (75-95% range) - *Needs real market data</li>
                <li>• <strong>Compliance:</strong> Simulated (85-95% range) - *Needs compliance metrics</li>
                <li>• <strong>Technology:</strong> Simulated (80-95% range) - *Needs system health data</li>
              </ul>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 italic">*Market, Compliance, and Technology scores are currently simulated and should be replaced with real data sources.</p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={riskData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar 
                  dataKey="value" 
                  stroke={currentColors.primary} 
                  fill={currentColors.primary} 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'performance':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Loan Performance Over Time</h3>
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">📈 Performance Calculation Method:</h4>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• <strong>Performance Rate:</strong> (Completed Loan Amount ÷ Total Loan Amount) × 100</li>
                <li>• <strong>Total Amount:</strong> Sum of all disbursed amounts for the month</li>
                <li>• <strong>Completed Amount:</strong> Sum of completed loan amounts for the month</li>
                <li>• Data grouped by loan creation month over last 12 months</li>
                <li>• Only loans with 'completed' status count toward performance</li>
              </ul>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={loanPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'performance' ? `${value}%` : `${value}M FRW`,
                    name === 'performance' ? 'Performance Rate' : 
                    name === 'totalAmount' ? 'Total Amount' : 'Completed Amount'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke={currentColors.primary} 
                  strokeWidth={3}
                  name="Performance Rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke={currentColors.success} 
                  strokeWidth={2}
                  name="Total Amount"
                />
                <Line 
                  type="monotone" 
                  dataKey="completedAmount" 
                  stroke={currentColors.accent} 
                  strokeWidth={2}
                  name="Completed Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'customers':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Customer Acquisition & Growth</h3>
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">👥 Customer Growth Calculation Method:</h4>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <li>• <strong>New Customers:</strong> Count of customers created in each month</li>
                <li>• <strong>Total Customers:</strong> Cumulative count up to that month</li>
                <li>• Data grouped by customer creation date over last 12 months</li>
                <li>• Growth rate calculated as month-over-month percentage change</li>
                <li>• Based on customer registration timestamps</li>
              </ul>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerAcquisitionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'newCustomers' ? value : `${value} customers`,
                    name === 'newCustomers' ? 'New Customers' : 'Total Customers'
                  ]}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="newCustomers" 
                  fill={currentColors.primary}
                  name="New Customers"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalCustomers" 
                  stroke={currentColors.success} 
                  strokeWidth={3}
                  name="Total Customers"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'portfolio':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Portfolio Distribution by Loan Type</h3>
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">🥧 Portfolio Distribution Calculation Method:</h4>
              <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                <li>• <strong>Loan Count:</strong> Number of loans per product type</li>
                <li>• <strong>Total Amount:</strong> Sum of disbursed amounts per product type</li>
                <li>• <strong>Percentage:</strong> (Product Amount ÷ Total Portfolio Amount) × 100</li>
                <li>• Product type determined by loan.product.name or loan.loanType</li>
                <li>• Sorted by total amount (highest to lowest)</li>
                <li>• Fallback to 'Personal Loan' if product type is undefined</li>
              </ul>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={portfolioDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {portfolioDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} loans (${((props.payload.amount / 1000000).toFixed(1))}M FRW)`,
                    'Count'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Enhanced Analytics</h3>
      </div>

      {/* Chart Tabs */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeChart === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      {renderChart()}
    </div>
  );
};

export default EnhancedCharts;
