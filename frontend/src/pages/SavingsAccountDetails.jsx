import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaWallet, 
  FaUser, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowLeft,
  FaEdit,
  FaHistory,
  FaChartLine,
  FaMobile,
  FaShieldAlt,
  FaMoneyBill,
  FaPercentage,
  FaClock,
  FaEye
} from 'react-icons/fa';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Table from '../components/Table';

const SavingsAccountDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchAccountDetails();
    } else {
      setError('Invalid account ID');
      navigate('/savings-accounts');
    }
  }, [id, navigate]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch account details
      const accountResponse = await fetch(`/api/savings-accounts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account details');
      }
      
      const accountData = await accountResponse.json();
      if (accountData.success) {
        setAccount(accountData.data);
      } else {
        throw new Error(accountData.message || 'Account not found');
      }

      // Fetch transaction history
      const transactionsResponse = await fetch(`/api/savings-accounts/${id}/transactions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        if (transactionsData.success) {
          setTransactions(transactionsData.data?.transactions || []);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'RWF 0';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status, isVerified) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="w-4 h-4 mr-1" />
          Pending Verification
        </span>
      );
    }
  };

  const getAccountTypeBadge = (accountType) => {
    const colors = {
      'regular': 'bg-blue-100 text-blue-800',
      'premium': 'bg-purple-100 text-purple-800',
      'fixed': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[accountType] || 'bg-gray-100 text-gray-800'}`}>
        {accountType?.charAt(0).toUpperCase() + accountType?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const transactionColumns = [
    {
      key: 'transactionId',
      header: 'Transaction ID',
      render: (item) => item.transactionId || `TXN-${item.id?.slice(-8)}`
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.type === 'deposit' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {item.type?.charAt(0).toUpperCase() + item.type?.slice(1)}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => (
        <span className={`font-semibold ${
          item.type === 'deposit' ? 'text-green-600' : 'text-red-600'
        }`}>
          {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount)}
        </span>
      )
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      render: (item) => formatCurrency(item.balanceAfter)
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => item.description || 'No description'
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item) => new Date(item.createdAt).toLocaleDateString()
    }
  ];

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!account) return <div>Account not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/savings-accounts')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <FaWallet className="text-white text-2xl" />
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {account.accountNumber}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">Savings Account</p>
                  <div className="flex items-center gap-4 mt-2">
                    {getAccountTypeBadge(account.accountType)}
                    {getStatusBadge(account.status, account.isVerified)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => navigate(`/savings-accounts/edit/${account.id}`)}
                className="flex items-center gap-2"
              >
                <FaEdit />
                Edit Account
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/deposit?accountId=${account.id}`)}
                className="flex items-center gap-2"
              >
                <FaMoneyBill />
                Deposit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaMoneyBill className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Balance</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(account.balance)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaPercentage className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interest Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {account.interestRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaShieldAlt className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Minimum Balance</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(account.minimumBalance)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FaCalendarAlt className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last Transaction</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {account.lastTransactionDate 
              ? new Date(account.lastTransactionDate).toLocaleDateString()
              : 'No transactions'
            }
          </p>
        </div>
      </div>

      {/* Account Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Account Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaWallet className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Account Number</span>
                <span className="text-gray-900 dark:text-white font-semibold font-mono">{account.accountNumber}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Account Type</span>
                <span className="text-gray-900 dark:text-white font-semibold">{account.accountType?.charAt(0).toUpperCase() + account.accountType?.slice(1)}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Status</span>
                <span className="text-gray-900 dark:text-white font-semibold">{account.status?.charAt(0).toUpperCase() + account.status?.slice(1)}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Verification Status</span>
                <div className="flex items-center gap-2">
                  {account.isVerified ? (
                    <>
                      <FaCheckCircle className="text-green-600" />
                      <span className="text-green-600 font-semibold">Verified</span>
                    </>
                  ) : (
                    <>
                      <FaClock className="text-yellow-600" />
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Created Date</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {new Date(account.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaUser className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Customer Name</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {account.customer?.fullName || account.customerId?.fullName || 'Unknown Customer'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Customer Code</span>
              <span className="text-gray-900 dark:text-white font-semibold font-mono">
                {account.customer?.customerCode || account.customerId?.customerCode || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Email</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {account.customer?.email || account.customerId?.email || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Phone</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {account.customer?.phone || account.customerId?.phone || 'N/A'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(`/customers/${account.customerId?._id || account.customer?.id}`)}
                className="flex items-center gap-2"
              >
                <FaEye />
                View Customer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FaHistory className="text-indigo-600 dark:text-indigo-400 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <FaHistory className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No transactions found for this account.</p>
          </div>
        ) : (
          <Table
            headers={['Transaction ID', 'Type', 'Amount', 'Balance After', 'Description', 'Date']}
            data={transactions}
            renderCell={(row, header) => {
              switch (header) {
                case 'Transaction ID':
                  return (
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {row.transactionId || `TXN-${row.id?.slice(-8)}`}
                    </span>
                  );
                case 'Type':
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.type === 'deposit' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {row.type?.charAt(0).toUpperCase() + row.type?.slice(1)}
                    </span>
                  );
                case 'Amount':
                  return (
                    <span className={`font-semibold ${
                      row.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {row.type === 'deposit' ? '+' : '-'}{formatCurrency(row.amount)}
                    </span>
                  );
                case 'Balance After':
                  return (
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(row.balanceAfter)}
                    </span>
                  );
                case 'Description':
                  return (
                    <span className="text-gray-700 dark:text-gray-300">
                      {row.description || 'No description'}
                    </span>
                  );
                case 'Date':
                  return (
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                  );
                default:
                  return (
                    <span className="text-gray-700 dark:text-gray-300">
                      {row[header.toLowerCase().replace(/\s/g, "")] || "-"}
                    </span>
                  );
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SavingsAccountDetails;