import React from "react";
import { useSystemColors } from "../hooks/useSystemColors";

const DashCard = (props) => {
  const { colors } = useSystemColors();
  
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

  return (
    <div className="relative group/card">
      <div 
        className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02]"
        style={{ 
          borderColor: `${currentColors.primary}20`
        }}
      >
        {/* Gradient overlay on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${currentColors.primary}08 0%, ${currentColors.primary}15 100%)`
          }}
        />
        
        <div className="relative p-3 sm:p-4 flex items-center justify-between">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1">
              {props.title && (
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 leading-tight">
                  {props.title}
                </h2>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight w-full">
              {props.number && props.number.includes('Frw') ? (
                <>
                  <span className="text-xs font-light text-gray-500 dark:text-gray-400">Frw </span>
                  {props.number.replace('Frw ', '')}
                </>
              ) : (
                props.number
              )}
            </h1>
            {props.subtitle && (
              <div className="flex items-center w-full">
                <p 
                  className="text-xs font-medium w-full"
                  style={{ color: currentColors.primary }}
                >
                  {props.subtitle}
                </p>
              </div>
            )}
          </div>

          <div 
            className="flex-shrink-0 ml-2 p-1.5 sm:p-2 rounded-lg transition-all duration-300 group-hover:scale-105"
            style={{ 
              backgroundColor: `${currentColors.primary}10`,
              border: `1px solid ${currentColors.primary}20`
            }}
          >
            <div className="transition-transform duration-300 group-hover:rotate-6">
              {props.icon}
            </div>
          </div>
        </div>
        
        {/* Bottom accent line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300"
          style={{ 
            backgroundColor: currentColors.primary,
            transform: 'scaleX(0)',
            transformOrigin: 'left'
          }}
        />
        
        {/* Hover effect for bottom line */}
        <style jsx>{`
          .group:hover .absolute.bottom-0 {
            transform: scaleX(1);
          }
        `}</style>
      </div>

      {/* Tooltip positioned above the entire dashcard */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-48 max-w-xs">
        <div className="text-center break-words whitespace-normal leading-relaxed">
          {props.description || "This dashboard card shows important metrics and data for your financial operations."}
        </div>
        {/* Arrow pointing down to the dashcard */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </div>
  );
};

export default DashCard;
