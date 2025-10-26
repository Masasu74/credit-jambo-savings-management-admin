// components/Table.jsx
import React from "react";

const Table = ({ headers = [], data = [], renderCell }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-2xl mb-4">📋</div>
        <div className="text-xl font-bold mb-2">No data available</div>
        <div className="text-sm">There are no records to display at the moment.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
          <tr className="border-b-2 border-gray-200 dark:border-gray-600">
            {headers.map((header, index) => (
              <th key={index} className="py-6 px-6 text-left">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-100 uppercase tracking-wider">
                  {header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              {headers.map((headerKey, cellIndex) => (
                <td key={cellIndex} className="py-5 px-6">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {renderCell ? renderCell(row, headerKey) : row[headerKey]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;