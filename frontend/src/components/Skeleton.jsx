import PropTypes from 'prop-types';

const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-600 rounded ${className}`}
      {...props}
    />
  );
};

export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-3 items-center">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
        </div>
      </div>

      {/* Search and Filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex gap-2 items-center flex-1">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-auto">
        <table className="min-w-full text-sm text-center border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="p-3">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
              ))}
              <th className="p-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-3">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </td>
                ))}
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

export const DashboardCardSkeleton = () => {
  return (
    <div className="relative group/card">
      <div className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02]">
        {/* Gradient overlay skeleton */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-blue-50/8 to-blue-100/15 dark:from-blue-900/8 dark:to-blue-800/15" />
        
        <div className="relative p-3 sm:p-4 flex items-center justify-between">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1">
              {/* Title skeleton */}
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </div>

            {/* Number skeleton */}
            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 mb-1" />
            
            {/* Subtitle skeleton */}
            <div className="flex items-center w-full">
              <Skeleton className="h-3 w-20 sm:w-28" />
            </div>
          </div>

          {/* Icon skeleton */}
          <div className="flex-shrink-0 ml-2 p-1.5 sm:p-2 rounded-lg bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200/20 dark:border-gray-600/20 transition-all duration-300 group-hover:scale-105">
            <Skeleton className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </div>
        
        {/* Bottom accent line skeleton */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 bg-gray-200 dark:bg-gray-600 transform scale-x-0 group-hover:scale-x-100 origin-left" />
      </div>
    </div>
  );
};

export const ActivityLogsSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-4">
      {/* Search and Filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex gap-2 items-center flex-1">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Activity Logs Table skeleton */}
      <div className="overflow-auto">
        <table className="min-w-full text-sm text-center border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="p-3">
                <Skeleton className="h-4 w-4 mx-auto" />
              </th>
              <th className="p-3">
                <Skeleton className="h-4 w-20 mx-auto" />
              </th>
              <th className="p-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
              <th className="p-3">
                <Skeleton className="h-4 w-20 mx-auto" />
              </th>
              <th className="p-3">
                <Skeleton className="h-4 w-24 mx-auto" />
              </th>
              <th className="p-3">
                <Skeleton className="h-4 w-20 mx-auto" />
              </th>
              <th className="p-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-4 w-32 mx-auto" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-4 w-40 mx-auto" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-4 w-28 mx-auto" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

export const ActivityLogsSummarySkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
  );
};

// PropTypes
Skeleton.propTypes = {
  className: PropTypes.string
};

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number
};

export default Skeleton; 