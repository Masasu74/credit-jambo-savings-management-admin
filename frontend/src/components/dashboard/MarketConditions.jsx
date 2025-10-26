import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, 
  FaChevronUp, 
  FaMinus,
  FaGlobe,
  FaDollarSign,
  FaShieldAlt,
  FaInfoCircle,
  FaSync
} from 'react-icons/fa';
import { useSystemColors } from '../../hooks/useSystemColors';

const MarketConditions = () => {
  const { colors } = useSystemColors();
  const [marketData, setMarketData] = useState({
    interestRate: 4.5,
    economicIndex: 'Stable',
    riskLevel: 'Medium',
    inflationRate: 2.1,
    gdpGrowth: 3.2,
    unemploymentRate: 4.8,
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(false);

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
    // Simulate fetching market data
    fetchMarketData();
    
    // Update market data every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    
    // Simulate API call with realistic market data variations
    setTimeout(() => {
      const baseData = {
        interestRate: 4.5,
        economicIndex: 'Stable',
        riskLevel: 'Medium',
        inflationRate: 2.1,
        gdpGrowth: 3.2,
        unemploymentRate: 4.8
      };

      // Add small random variations to simulate real market conditions
      const variations = {
        interestRate: (Math.random() - 0.5) * 0.2, // ±0.1%
        inflationRate: (Math.random() - 0.5) * 0.3, // ±0.15%
        gdpGrowth: (Math.random() - 0.5) * 0.4, // ±0.2%
        unemploymentRate: (Math.random() - 0.5) * 0.2 // ±0.1%
      };

      const newData = {
        interestRate: Math.max(3.0, Math.min(6.0, baseData.interestRate + variations.interestRate)),
        economicIndex: getEconomicIndex(baseData.gdpGrowth + variations.gdpGrowth),
        riskLevel: getRiskLevel(baseData.inflationRate + variations.inflationRate),
        inflationRate: Math.max(1.0, Math.min(5.0, baseData.inflationRate + variations.inflationRate)),
        gdpGrowth: Math.max(1.0, Math.min(6.0, baseData.gdpGrowth + variations.gdpGrowth)),
        unemploymentRate: Math.max(3.0, Math.min(8.0, baseData.unemploymentRate + variations.unemploymentRate)),
        lastUpdated: new Date()
      };

      setMarketData(newData);
      setLoading(false);
    }, 1000);
  };

  const getEconomicIndex = (gdpGrowth) => {
    if (gdpGrowth >= 4.0) return 'Strong';
    if (gdpGrowth >= 3.0) return 'Stable';
    if (gdpGrowth >= 2.0) return 'Moderate';
    return 'Weak';
  };

  const getRiskLevel = (inflationRate) => {
    if (inflationRate <= 2.0) return 'Low';
    if (inflationRate <= 3.0) return 'Medium';
    if (inflationRate <= 4.0) return 'High';
    return 'Very High';
  };

  const getTrendIcon = (value, isPositive = true) => {
    const change = (Math.random() - 0.5) * 0.2; // Simulate small changes
    if (change > 0.05) {
      return isPositive ? <FaChevronUp className="text-green-500" /> : <FaMinus className="text-red-500" />;
    } else if (change < -0.05) {
      return isPositive ? <FaMinus className="text-red-500" /> : <FaChevronUp className="text-green-500" />;
    }
    return <FaMinus className="text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Strong': 'text-green-600 dark:text-green-400',
      'Stable': 'text-blue-600 dark:text-blue-400',
      'Moderate': 'text-yellow-600 dark:text-yellow-400',
      'Weak': 'text-orange-600 dark:text-orange-400',
      'Low': 'text-green-600 dark:text-green-400',
      'Medium': 'text-yellow-600 dark:text-yellow-400',
      'High': 'text-orange-600 dark:text-orange-400',
      'Very High': 'text-red-600 dark:text-red-400'
    };
    return colors[status] || colors.Stable;
  };

  const getStatusBg = (status) => {
    const backgrounds = {
      'Strong': 'bg-green-50 dark:bg-green-900/20',
      'Stable': 'bg-blue-50 dark:bg-blue-900/20',
      'Moderate': 'bg-yellow-50 dark:bg-yellow-900/20',
      'Weak': 'bg-orange-50 dark:bg-orange-900/20',
      'Low': 'bg-green-50 dark:bg-green-900/20',
      'Medium': 'bg-yellow-50 dark:bg-yellow-900/20',
      'High': 'bg-orange-50 dark:bg-orange-900/20',
      'Very High': 'bg-red-50 dark:bg-red-900/20'
    };
    return backgrounds[status] || backgrounds.Stable;
  };

  const marketIndicators = [
    {
      title: 'Interest Rate',
      value: `${marketData.interestRate.toFixed(1)}%`,
      icon: <FaDollarSign size={20} />,
      description: 'Current lending rate',
      detailedDescription: 'Interest Rate represents the current cost of borrowing money in the economy. This rate affects loan pricing, investment decisions, and economic growth. Lower rates (≤4%) encourage borrowing and investment, while higher rates (≥5%) may slow economic activity but help control inflation.',
      status: marketData.interestRate <= 4.0 ? 'Low' : marketData.interestRate <= 5.0 ? 'Medium' : 'High',
      trend: getTrendIcon(marketData.interestRate, false),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Economic Index',
      value: marketData.economicIndex,
      icon: <FaGlobe size={20} />,
      description: 'Overall economic health',
      detailedDescription: 'Economic Index measures overall economic health based on GDP growth rates. Strong (≥4% GDP) indicates robust economic expansion, Stable (3-4% GDP) shows steady growth, Moderate (2-3% GDP) suggests slower growth, and Weak (<2% GDP) indicates economic challenges.',
      status: marketData.economicIndex,
      trend: getTrendIcon(marketData.gdpGrowth),
      color: getStatusColor(marketData.economicIndex),
      bgColor: getStatusBg(marketData.economicIndex)
    },
    {
      title: 'Risk Level',
      value: marketData.riskLevel,
      icon: <FaShieldAlt size={20} />,
      description: 'Market risk assessment',
      detailedDescription: 'Risk Level assesses market risk based on inflation rates and economic stability. Low Risk (≤2% inflation) indicates stable economic conditions, Medium Risk (2-3% inflation) shows moderate concerns, High Risk (3-4% inflation) suggests economic pressure, and Very High Risk (>4% inflation) indicates significant economic challenges.',
      status: marketData.riskLevel,
      trend: getTrendIcon(marketData.inflationRate, false),
      color: getStatusColor(marketData.riskLevel),
      bgColor: getStatusBg(marketData.riskLevel)
    },
    {
      title: 'Inflation Rate',
      value: `${marketData.inflationRate.toFixed(1)}%`,
      icon: <FaChartLine size={20} />,
      description: 'Annual inflation rate',
      detailedDescription: 'Inflation Rate measures the annual increase in prices of goods and services. Low inflation (≤2%) is ideal for economic stability, Medium inflation (2-3%) is manageable, while High inflation (>3%) can erode purchasing power and create economic uncertainty. Central banks typically target 2-3% inflation.',
      status: marketData.inflationRate <= 2.0 ? 'Low' : marketData.inflationRate <= 3.0 ? 'Medium' : 'High',
      trend: getTrendIcon(marketData.inflationRate, false),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'GDP Growth',
      value: `${marketData.gdpGrowth.toFixed(1)}%`,
      icon: <FaChevronUp size={20} />,
      description: 'Economic growth rate',
      detailedDescription: 'GDP Growth measures the annual increase in economic output. Strong growth (≥4%) indicates robust economic expansion and investment opportunities, Stable growth (3-4%) shows healthy economic development, while Moderate growth (2-3%) suggests slower but steady progress. This metric directly impacts business confidence and lending opportunities.',
      status: marketData.gdpGrowth >= 4.0 ? 'Strong' : marketData.gdpGrowth >= 3.0 ? 'Stable' : 'Moderate',
      trend: getTrendIcon(marketData.gdpGrowth),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Unemployment',
      value: `${marketData.unemploymentRate.toFixed(1)}%`,
      icon: <FaInfoCircle size={20} />,
      description: 'Unemployment rate',
      detailedDescription: 'Unemployment Rate measures the percentage of the labor force that is jobless and actively seeking employment. Low unemployment (≤4%) indicates a strong job market and economic health, Medium unemployment (4-6%) shows moderate economic conditions, while High unemployment (>6%) suggests economic challenges and reduced consumer spending power.',
      status: marketData.unemploymentRate <= 4.0 ? 'Low' : marketData.unemploymentRate <= 6.0 ? 'Medium' : 'High',
      trend: getTrendIcon(marketData.unemploymentRate, false),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Market Conditions</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated {marketData.lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchMarketData}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh market data"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {marketIndicators.map((indicator, index) => (
            <div key={index} className="relative group/card">
              <div
                className={`${indicator.bgColor} p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${indicator.color} bg-white dark:bg-gray-700 shadow-sm`}>
                    {indicator.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {indicator.trend}
                  </div>
                </div>
                
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {indicator.value}
                  </h4>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {indicator.title}
                  </p>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {indicator.description}
                </p>
                
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${indicator.bgColor} ${indicator.color} border`}>
                    {indicator.status}
                  </span>
                </div>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-80 max-w-xs">
                <div className="text-center break-words whitespace-normal leading-relaxed">
                  <div className="font-semibold mb-1 text-sm">{indicator.title}</div>
                  <div className="text-xs opacity-90">{indicator.detailedDescription}</div>
                </div>
                {/* Arrow pointing down to the card */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <FaInfoCircle size={14} />
            <span>Market data updates every 5 minutes</span>
          </div>
          <div className="text-xs">
            Last updated: {marketData.lastUpdated.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketConditions;
