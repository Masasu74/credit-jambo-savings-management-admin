import React from 'react';
import { useParams } from 'react-router-dom';

const SavingsAccountDetails = () => {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Savings Account Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Account ID: {id}
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Account details will be implemented here.</p>
      </div>
    </div>
  );
};

export default SavingsAccountDetails;
