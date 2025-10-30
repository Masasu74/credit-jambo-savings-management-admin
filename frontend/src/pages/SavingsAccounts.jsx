import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPlus, 
  FaEye, 
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';

const SavingsAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/savings-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      // The backend returns data in this format: { success: true, data: { accounts: [...], pagination: {...} } }
      const accountsData = data.success && data.data?.accounts ? data.data.accounts : [];
      setAccounts(accountsData);
    } catch (err) {
      setError(err.message);
      setAccounts([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, isVerified) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="w-3 h-3 mr-1" />
          Pending Verification
        </span>
      );
    }
  };

  const getAccountTypeBadge = (accountType) => {
    const colors = {
      'Standard Savings': 'bg-blue-100 text-blue-800',
      'Fixed Deposit': 'bg-purple-100 text-purple-800',
      'Current Account': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[accountType] || 'bg-gray-100 text-gray-800'}`}>
        {accountType}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{borderColor: '#00b050'}}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <FaTimesCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Savings Accounts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer savings accounts and verify new accounts
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/savings-accounts/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
            style={{backgroundColor: '#00b050'}}
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Add Account
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md" style={{backgroundColor: '#00b050'}}>
                  <FaCheckCircle className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Accounts</dt>
                  <dd className="text-lg font-medium text-gray-900">{accounts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md bg-green-500">
                  <FaCheckCircle className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(accounts || []).filter(acc => acc.isVerified).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md bg-yellow-500">
                  <FaClock className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(accounts || []).filter(acc => !acc.isVerified).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md bg-blue-500">
                  <span className="text-white text-sm font-bold m-1.5">RWF</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString()} RWF
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Accounts</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            A list of all savings accounts in the system
          </p>
        </div>
        
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new savings account.</p>
            <div className="mt-6">
              <Link
                to="/savings-accounts/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                style={{backgroundColor: '#00b050'}}
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Add Account
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {(accounts || []).map((account) => (
              <li key={account.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#00b050'}}>
                        <span className="text-white font-medium text-sm">
                          {account.accountNumber?.slice(-2) || 'SA'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {account.accountNumber}
                        </p>
                        {getStatusBadge(account.status, account.isVerified)}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-500">
                          {account.customer?.fullName || account.customerId?.fullName || 'Unknown Customer'}
                        </p>
                        <span className="mx-2">•</span>
                        {getAccountTypeBadge(account.accountType)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {account.balance?.toLocaleString() || 0} RWF
                      </p>
                      <p className="text-xs text-gray-500">
                        {account.interestRate}% interest
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/savings-accounts/${account.id}`}
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => console.log('👁️ View savings account clicked:', account.id)}
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/savings-accounts/edit/${account.id}`}
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => console.log('✏️ Edit savings account clicked:', account.id)}
                      >
                        <FaEdit className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SavingsAccounts;
