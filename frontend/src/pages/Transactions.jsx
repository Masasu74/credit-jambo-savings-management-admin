import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaArrowDown, 
  FaArrowUp,
  FaEye,
  FaPlus,
  FaFilter
} from 'react-icons/fa';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      // The backend returns data in this format: { success: true, data: { transactions: [...], pagination: {...} } }
      const transactionsData = data.success && data.data?.transactions ? data.data.transactions : [];
      setTransactions(transactionsData);
    } catch (err) {
      setError(err.message);
      setTransactions([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'deposit') {
      return <FaArrowDown className="h-5 w-5 text-green-500" />;
    } else if (type === 'withdrawal') {
      return <FaArrowUp className="h-5 w-5 text-red-500" />;
    }
    return <div className="h-5 w-5 rounded-full bg-gray-300" />;
  };

  const getTransactionBadge = (type, status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    if (type === 'deposit') {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          Deposit
        </span>
      );
    } else if (type === 'withdrawal') {
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800`}>
          Withdrawal
        </span>
      );
    }
    
    return (
      <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const filteredTransactions = (transactions || []).filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

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
            Transactions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all financial transactions
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Link
            to="/deposit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
            style={{backgroundColor: '#00b050'}}
          >
            <FaArrowDown className="h-4 w-4 mr-2" />
            Deposit
          </Link>
          <Link
            to="/withdraw"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaArrowUp className="h-4 w-4 mr-2" />
            Withdraw
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
                  <span className="text-white text-sm font-bold m-1.5">T</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="text-lg font-medium text-gray-900">{transactions.length}</dd>
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
                  <FaArrowDown className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Deposits</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(transactions || []).filter(t => t.type === 'deposit').length}
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
                <div className="w-8 h-8 rounded-md bg-red-500">
                  <FaArrowUp className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Withdrawals</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(transactions || []).filter(t => t.type === 'withdrawal').length}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Volume</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()} RWF
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white px-4 py-3 shadow rounded-lg">
        <div className="flex items-center space-x-4">
          <FaFilter className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-2">
            {['all', 'deposit', 'withdrawal'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === filterType
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={filter === filterType ? {backgroundColor: '#00b050'} : {}}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction History</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            A list of all financial transactions in the system
          </p>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500">No transactions found for the selected filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {(filteredTransactions || []).map((transaction) => (
              <li key={transaction.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100">
                        {getTransactionIcon(transaction.type)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.transactionId || transaction.reference || `TXN-${transaction.id?.slice(-8)}`}
                        </p>
                        {getTransactionBadge(transaction.type, transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-500">
                          {transaction.description || 'No description'}
                        </p>
                        <span className="mx-2">•</span>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {transaction.amount?.toLocaleString() || 0} RWF
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: {transaction.balanceAfter?.toLocaleString() || 0} RWF
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => console.log('👁️ View transaction clicked:', transaction.id)}
                      >
                        <FaEye className="h-5 w-5" />
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

export default Transactions;
