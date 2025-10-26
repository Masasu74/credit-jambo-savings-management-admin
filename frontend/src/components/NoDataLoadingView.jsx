import React from 'react';
import { ClipLoader } from 'react-spinners';
import { useSystemColors } from '../hooks/useSystemColors';

/**
 * Component that shows a "no data" view with loading animation
 * Used when data is being fetched before the component renders
 */
const NoDataLoadingView = ({ 
  title = "Loading Data...", 
  description = "Please wait while we fetch your data",
  showSpinner = true,
  icon = "📋",
  className = ""
}) => {
  const { colors } = useSystemColors();
  const currentColors = colors || { primary: '#3b82f6' };

  return (
    <div className={`p-4 md:p-6 lg:p-10 gap-6 flex flex-col w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {/* No Data View with Loading */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icon */}
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
            {icon}
          </div>
          
          {/* Loading Spinner */}
          {showSpinner && (
            <div className="flex items-center justify-center mb-4">
              <ClipLoader 
                color={currentColors.primary} 
                size={32} 
                speedMultiplier={0.8}
              />
            </div>
          )}
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {showSpinner ? "Loading Data..." : "No Data Available"}
          </h3>
          
          {/* Description */}
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {showSpinner 
              ? "We're fetching the latest information for you. This will only take a moment."
              : "There are no items to display at the moment."
            }
          </p>
          
          {/* Loading dots animation */}
          {showSpinner && (
            <div className="flex space-x-1 mt-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoDataLoadingView;
