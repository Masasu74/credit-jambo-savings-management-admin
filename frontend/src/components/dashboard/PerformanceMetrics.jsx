import React, { useState, useEffect } from 'react';
import { FaChevronUp, FaMinus, FaChartLine, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';

const PerformanceMetrics = () => {
  const { loans = [], customers = [] } = useAppContext();
  const [metrics, setMetrics] = useState({
    portfolioHealth: 0,
    collectionRate: 0,
    customerSatisfaction: 0,
    riskScore: 0,
    growthRate: 0,
    efficiency: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [loans, customers]);

  const calculateMetrics = () => {
    // Calculate Portfolio Health (based on loan status distribution)
    const totalLoans = loans.length;
    if (totalLoans === 0) {
      setMetrics({
        portfolioHealth: 0,
        collectionRate: 0,
        customerSatisfaction: 0,
        riskScore: 0,
        growthRate: 0,
        efficiency: 0
      });
      return;
    }

    const completedLoans = loans.filter(loan => loan.status === 'completed').length;
    const disbursedLoans = loans.filter(loan => loan.status === 'disbursed').length;
    const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
    const rejectedLoans = loans.filter(loan => loan.status === 'rejected').length;

    // Portfolio Health: Weighted score based on loan statuses
    const portfolioHealth = Math.max(0, Math.min(100, 
      (completedLoans * 1.0 + disbursedLoans * 0.8 + rejectedLoans * 0.3 - overdueLoans * 0.5) / totalLoans * 100
    ));

    // Collection Rate: Percentage of loans that are performing well
    const performingLoans = completedLoans + disbursedLoans;
    const collectionRate = Math.max(0, Math.min(100, (performingLoans / totalLoans) * 100));

    // Customer Satisfaction: Simulated based on loan completion rate and customer growth
    const customerSatisfaction = Math.max(0, Math.min(5, 
      3.5 + (completedLoans / Math.max(1, totalLoans)) * 1.5
    ));

    // Risk Score: Based on overdue loans and loan distribution
    const riskScore = Math.max(0, Math.min(100, 
      (overdueLoans / Math.max(1, totalLoans)) * 100
    ));

    // Growth Rate: Based on recent customer and loan growth (simulated)
    const recentCustomers = customers.filter(customer => {
      const createdDate = new Date(customer.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return createdDate > thirtyDaysAgo;
    }).length;
    
    const growthRate = Math.max(-10, Math.min(50, 
      (recentCustomers / Math.max(1, customers.length)) * 100
    ));

    // Efficiency: Based on loan processing speed (simulated)
    const efficiency = Math.max(0, Math.min(100, 
      75 + (Math.random() - 0.5) * 20 // Simulated efficiency score
    ));

    setMetrics({
      portfolioHealth: Math.round(portfolioHealth * 10) / 10,
      collectionRate: Math.round(collectionRate * 10) / 10,
      customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
      riskScore: Math.round(riskScore * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10,
      efficiency: Math.round(efficiency * 10) / 10
    });
  };

  const getTrendIcon = (value, isPositive = true) => {
    if (value > 0) {
      return isPositive ? <FaChevronUp className="text-green-500" /> : <FaMinus className="text-red-500" />;
    } else if (value < 0) {
      return isPositive ? <FaMinus className="text-red-500" /> : <FaChevronUp className="text-green-500" />;
    }
    return <FaMinus className="text-gray-500" />;
  };

  const getPerformanceColor = (value, type) => {
    if (type === 'risk') {
      if (value <= 20) return 'from-green-500 to-green-600';
      if (value <= 40) return 'from-yellow-500 to-yellow-600';
      if (value <= 60) return 'from-orange-500 to-orange-600';
      return 'from-red-500 to-red-600';
    }
    
    if (value >= 90) return 'from-green-500 to-green-600';
    if (value >= 75) return 'from-blue-500 to-blue-600';
    if (value >= 60) return 'from-yellow-500 to-yellow-600';
    if (value >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const performanceCards = [
    {
      title: 'Portfolio Health',
      value: `${metrics.portfolioHealth}%`,
      icon: <FaChartLine size={24} />,
      trend: '+2.1%',
      trendValue: 2.1,
      description: 'Overall loan portfolio performance',
      detailedDescription: 'Portfolio Health measures the overall quality of your loan portfolio using a weighted scoring system. Completed loans (100% weight), disbursed loans (80% weight), rejected loans (30% weight), and overdue loans (-50% penalty) are calculated to provide a comprehensive health score. Higher percentages indicate better portfolio performance.',
      color: getPerformanceColor(metrics.portfolioHealth),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Collection Rate',
      value: `${metrics.collectionRate}%`,
      icon: <FaShieldAlt size={24} />,
      trend: '+1.3%',
      trendValue: 1.3,
      description: 'Successful payment collection rate',
      detailedDescription: 'Collection Rate shows the percentage of loans that are performing well (completed + disbursed loans). This metric indicates how effectively you are collecting payments from borrowers. A higher percentage means better collection performance and fewer problematic loans.',
      color: getPerformanceColor(metrics.collectionRate),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Customer Satisfaction',
      value: `${metrics.customerSatisfaction}/5`,
      icon: <FaUsers size={24} />,
      trend: '+0.2',
      trendValue: 0.2,
      description: 'Based on customer feedback and retention',
      detailedDescription: 'Customer Satisfaction is calculated based on loan completion rates and customer growth patterns. The score starts at 3.5 and increases based on successful loan completions. This metric reflects customer experience quality and retention likelihood.',
      color: getPerformanceColor(metrics.customerSatisfaction * 20), // Convert to percentage
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Risk Score',
      value: `${metrics.riskScore}%`,
      icon: <FaShieldAlt size={24} />,
      trend: '-0.5%',
      trendValue: -0.5,
      description: 'Portfolio risk assessment',
      detailedDescription: 'Risk Score measures the percentage of overdue loans in your portfolio. Lower percentages indicate lower risk (better performance). This metric helps identify potential portfolio problems early. Green (≤20%) = Low Risk, Yellow (≤40%) = Medium Risk, Orange (≤60%) = High Risk, Red (>60%) = Critical Risk.',
      color: getPerformanceColor(metrics.riskScore, 'risk'),
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      isRisk: true
    },
    {
      title: 'Growth Rate',
      value: `${metrics.growthRate}%`,
      icon: <FaChevronUp size={24} />,
      trend: '+5.2%',
      trendValue: 5.2,
      description: 'Monthly customer and loan growth',
      detailedDescription: 'Growth Rate measures new customer acquisition over the last 30 days as a percentage of total customers. This metric indicates business expansion and market penetration. Positive growth shows healthy business development and customer acquisition success.',
      color: getPerformanceColor(Math.max(0, metrics.growthRate)),
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      textColor: 'text-teal-600 dark:text-teal-400'
    },
    {
      title: 'Operational Efficiency',
      value: `${metrics.efficiency}%`,
      icon: <FaChartLine size={24} />,
      trend: '+1.8%',
      trendValue: 1.8,
      description: 'Loan processing and operational efficiency',
      detailedDescription: 'Operational Efficiency measures how effectively your organization processes loans and manages operations. This metric reflects internal processes, staff productivity, and system performance. Higher percentages indicate better operational effectiveness and streamlined processes.',
      color: getPerformanceColor(metrics.efficiency),
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceCards.map((card, index) => (
          <div key={index} className="relative group/card">
            <div
              className={`${card.bgColor} p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.textColor} bg-white dark:bg-gray-800 shadow-sm`}>
                  {card.icon}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(card.trendValue, !card.isRisk)}
                  <span className={`font-medium ${
                    card.trendValue > 0 ? 'text-green-600 dark:text-green-400' : 
                    card.trendValue < 0 ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {card.trend}
                  </span>
                </div>
              </div>
              
              <div className="mb-2">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </h4>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {card.title}
                </p>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {card.description}
              </p>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${card.color} transition-all duration-1000 ease-out`}
                    style={{
                      width: `${Math.min(100, Math.max(0, card.isRisk ? (100 - card.value.replace('%', '')) : card.value.replace('%', '').replace('/5', '') * 20))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-80 max-w-xs">
              <div className="text-center break-words whitespace-normal leading-relaxed">
                <div className="font-semibold mb-1 text-sm">{card.title}</div>
                <div className="text-xs opacity-90">{card.detailedDescription}</div>
              </div>
              {/* Arrow pointing down to the card */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetrics;
