import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowDown, 
  FaArrowUp, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowLeft,
  FaUser,
  FaWallet,
  FaClock,
  FaShieldAlt,
  FaMoneyBill,
  FaReceipt,
  FaMobile,
  FaDesktop,
  FaEye
} from 'react-icons/fa';
import Loader from '../components/Loader';
import Button from '../components/Button';

const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchTransactionDetails();
    } else {
      setError('Invalid transaction ID');
      navigate('/transactions');
    }
  }, [id, navigate]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }
      
      const data = await response.json();
      if (data.success) {
        setTransaction(data.data);
      } else {
        throw new Error(data.message || 'Transaction not found');
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
      'failed': { color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
      'cancelled': { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getTransactionIcon = (type) => {
    if (type === 'deposit') {
      return <FaArrowDown className="h-8 w-8 text-green-500" />;
    } else if (type === 'withdrawal') {
      return <FaArrowUp className="h-8 w-8 text-red-500" />;
    }
    return <FaReceipt className="h-8 w-8 text-gray-500" />;
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <FaMobile className="h-5 w-5 text-gray-400" />;
    
    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <FaMobile className="h-5 w-5 text-blue-500" />;
    } else if (agent.includes('desktop') || agent.includes('windows') || agent.includes('mac')) {
      return <FaDesktop className="h-5 w-5 text-green-500" />;
    }
    return <FaMobile className="h-5 w-5 text-gray-400" />;
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!transaction) return <div>Transaction not found</div>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/transactions')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {transaction.transactionId || `TXN-${transaction.id?.slice(-8)}`}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {transaction.type?.charAt(0).toUpperCase() + transaction.type?.slice(1)} Transaction
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(transaction.status)}
                    <span className={`text-2xl font-bold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaMoneyBill className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Amount</h3>
          </div>
          <p className={`text-3xl font-bold ${
            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaWallet className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Balance After</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(transaction.balanceAfter)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaShieldAlt className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h3>
          </div>
          <div className="mt-2">
            {getStatusBadge(transaction.status)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FaCalendarAlt className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Date</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      {/* Transaction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Transaction Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaReceipt className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Transaction ID</span>
                <span className="text-gray-900 dark:text-white font-semibold font-mono">{transaction.transactionId || `TXN-${transaction.id?.slice(-8)}`}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Type</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  transaction.type === 'deposit' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type?.charAt(0).toUpperCase() + transaction.type?.slice(1)}
                </span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Amount</span>
                <span className={`text-lg font-bold ${
                  transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Status</span>
                <div className="mt-1">
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Description</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {transaction.description || 'No description provided'}
              </span>
            </div>
            
            {transaction.reference && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Reference</span>
                <span className="text-gray-900 dark:text-white font-semibold font-mono">
                  {transaction.reference}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaWallet className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Account Number</span>
              <span className="text-gray-900 dark:text-white font-semibold font-mono">
                {transaction.account?.accountNumber || transaction.accountId?.accountNumber || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Account Type</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {transaction.account?.accountType?.charAt(0).toUpperCase() + transaction.account?.accountType?.slice(1) || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Balance Before</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {formatCurrency(transaction.balanceBefore)}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Balance After</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {formatCurrency(transaction.balanceAfter)}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(`/savings-accounts/${transaction.accountId?._id || transaction.account?.id}`)}
                className="flex items-center gap-2"
              >
                <FaEye />
                View Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FaUser className="text-indigo-600 dark:text-indigo-400 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Customer Name</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {transaction.customer?.fullName || transaction.customerId?.fullName || 'Unknown Customer'}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Customer Code</span>
            <span className="text-gray-900 dark:text-white font-semibold font-mono">
              {transaction.customer?.customerCode || transaction.customerId?.customerCode || 'N/A'}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Email</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {transaction.customer?.email || transaction.customerId?.email || 'N/A'}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Phone</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {transaction.customer?.phone || transaction.customerId?.phone || 'N/A'}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Processed By</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {transaction.processedBy?.fullName || 'System'}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Device</span>
            <div className="flex items-center gap-2">
              {getDeviceIcon(transaction.userAgent)}
              <span className="text-gray-900 dark:text-white font-semibold text-sm">
                {transaction.deviceId || 'Unknown Device'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/customers/${transaction.customerId?._id || transaction.customer?.id}`)}
            className="flex items-center gap-2"
          >
            <FaEye />
            View Customer
          </Button>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <FaShieldAlt className="text-gray-600 dark:text-gray-400 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Technical Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Transaction ID</span>
            <span className="text-gray-900 dark:text-white font-semibold font-mono text-sm">
              {transaction.id}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Created At</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
          
          {transaction.updatedAt && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Updated At</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {new Date(transaction.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
          
          {transaction.ipAddress && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">IP Address</span>
              <span className="text-gray-900 dark:text-white font-semibold font-mono">
                {transaction.ipAddress}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;